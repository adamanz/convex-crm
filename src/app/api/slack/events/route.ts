import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import {
  verifySlackSignature,
  detectSignalType,
  analyzeSentiment,
} from "@/lib/slack";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Track processed events to prevent duplicates
const processedEvents = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    // Handle URL verification challenge FIRST (before signature check)
    if (payload.type === "url_verification") {
      console.log("Slack URL verification challenge received");
      return NextResponse.json({ challenge: payload.challenge });
    }

    const timestamp = request.headers.get("x-slack-request-timestamp") || "";
    const signature = request.headers.get("x-slack-signature") || "";

    // Verify request signature in production for all other requests
    if (process.env.NODE_ENV === "production" && process.env.SLACK_SIGNING_SECRET) {
      const isValid = await verifySlackSignature(
        process.env.SLACK_SIGNING_SECRET,
        timestamp,
        body,
        signature
      );

      if (!isValid) {
        console.error("Invalid Slack signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Handle event callbacks
    if (payload.type === "event_callback") {
      const event = payload.event;
      const eventId = payload.event_id;

      // Dedupe events (Slack may retry)
      if (processedEvents.has(eventId)) {
        return NextResponse.json({ ok: true });
      }
      processedEvents.add(eventId);

      // Limit set size to prevent memory leak
      if (processedEvents.size > 1000) {
        const entries = Array.from(processedEvents).slice(0, 500);
        entries.forEach((id) => processedEvents.delete(id));
      }

      // Ignore bot messages to prevent loops
      if (event.bot_id || event.subtype === "bot_message") {
        return NextResponse.json({ ok: true });
      }

      // Handle @mentions - respond to the user
      if (event.type === "app_mention") {
        await handleMention(payload, event);
      }

      // Process message events - store ALL messages
      if (event.type === "message" || event.type === "app_mention") {
        await processMessage(payload, event);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack events error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function processMessage(
  payload: {
    team_id: string;
    api_app_id: string;
    event_id: string;
  },
  event: {
    type: string;
    text?: string;
    user?: string;
    channel?: string;
    ts?: string;
    thread_ts?: string;
  }
) {
  const text = event.text || "";

  // Skip empty messages
  if (!text.trim()) return;

  // Detect signal type (may be null if no signal)
  const signalDetection = detectSignalType(text);

  // Analyze sentiment
  const sentimentAnalysis = analyzeSentiment(text);

  // Store message (and optionally create signal)
  try {
    const result = await convex.mutation(api.slackSync.storeSlackMessage, {
      slackTeamId: payload.team_id,
      slackChannelId: event.channel || "",
      slackMessageTs: event.ts || "",
      slackUserId: event.user || "",
      text: text,
      // Only include signal info if detected
      ...(signalDetection ? {
        signalType: signalDetection.type as "expansion" | "risk" | "buying_intent" | "usage" | "churn" | "relationship",
        confidence: signalDetection.confidence,
        sentiment: sentimentAnalysis.sentiment,
        isUrgent: sentimentAnalysis.urgency,
      } : {}),
    });

    if (result.signalId) {
      console.log(`Message stored with signal: ${result.signalId}`);
    } else {
      console.log(`Message stored: ${result.messageId}`);
    }
  } catch (error) {
    console.error("Failed to store message:", error);
  }
}

async function handleMention(
  payload: { team_id: string },
  event: { text?: string; channel?: string; ts?: string; user?: string }
) {
  const text = (event.text || "").toLowerCase();
  const channel = event.channel;
  const threadTs = event.ts;

  if (!channel || !process.env.SLACK_BOT_TOKEN) {
    console.error("Missing channel or bot token for mention response");
    return;
  }

  let responseBlocks: any[] = [];
  let responseText = "";

  // Parse what user is asking about
  if (text.includes("help") || text.includes("what can you do")) {
    responseText = "Here's what I can do!";
    responseBlocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Hi! I'm Momentum* :wave:\n\nI monitor your conversations for sales signals and help you stay on top of opportunities.",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Try these commands:*\n• `/momentum` - View dashboard\n• `/momentum signals` - See recent signals\n• `/momentum stats` - Analytics\n• `@Momentum status` - Quick status\n• `@Momentum signals` - Recent signals",
        },
      },
    ];
  } else if (text.includes("status") || text.includes("how are") || text.includes("dashboard")) {
    // Get quick stats
    try {
      const stats = await convex.query(api.signals.getStats, {});
      responseText = "Here's your Momentum status";
      responseBlocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Momentum Status* :chart_with_upwards_trend:\n\n• *${stats.totalSignals}* total signals detected\n• *${stats.newSignals}* new signals\n• *${stats.highConfidenceSignals}* high confidence\n• *${stats.urgentSignals}* urgent`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Open Dashboard", emoji: true },
              url: `${process.env.NEXT_PUBLIC_APP_URL || "https://convex-crm-ten.vercel.app"}/momentum`,
              action_id: "open_dashboard",
            },
          ],
        },
      ];
    } catch (error) {
      console.error("Failed to get stats:", error);
      responseText = "I couldn't fetch the stats right now. Try `/momentum` instead.";
    }
  } else if (text.includes("signal")) {
    // Get recent signals
    try {
      const signals = await convex.query(api.signals.listSignals, { status: "new", limit: 3 });
      if (signals.length === 0) {
        responseText = "No new signals detected yet. I'm watching your conversations!";
      } else {
        const signalEmoji: Record<string, string> = {
          expansion: ":chart_with_upwards_trend:",
          risk: ":warning:",
          buying_intent: ":moneybag:",
          usage: ":gear:",
          churn: ":rotating_light:",
          relationship: ":busts_in_silhouette:",
        };
        responseText = "Here are your recent signals";
        responseBlocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Recent Signals* (${signals.length} new)`,
            },
          },
          ...signals.map((s) => ({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${signalEmoji[s.type] || ":bell:"} *${s.type.replace("_", " ")}* (${s.confidence}%)\n>${s.text.slice(0, 100)}...`,
            },
          })),
        ];
      }
    } catch (error) {
      console.error("Failed to get signals:", error);
      responseText = "I couldn't fetch signals right now. Try `/momentum signals` instead.";
    }
  } else {
    // Default greeting
    responseText = `Hey <@${event.user}>! I'm Momentum. Try asking me about "status", "signals", or "help".`;
  }

  // Send response to Slack
  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        thread_ts: threadTs,
        text: responseText,
        ...(responseBlocks.length > 0 ? { blocks: responseBlocks } : {}),
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error("Slack API error:", result.error);
    }
  } catch (error) {
    console.error("Failed to send mention response:", error);
  }
}
