import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { verifySlackSignature, callSlackApi, SLACK_API_ENDPOINTS } from "@/lib/slack";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const timestamp = request.headers.get("x-slack-request-timestamp") || "";
    const signature = request.headers.get("x-slack-signature") || "";

    // Verify request signature in production (skip for now to debug)
    // TODO: Re-enable after debugging
    // if (process.env.NODE_ENV === "production" && process.env.SLACK_SIGNING_SECRET) {
    //   const isValid = await verifySlackSignature(
    //     process.env.SLACK_SIGNING_SECRET,
    //     timestamp,
    //     body,
    //     signature
    //   );
    //
    //   if (!isValid) {
    //     return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    //   }
    // }

    // Parse form data
    const params = new URLSearchParams(body);
    const command = params.get("command");
    const text = params.get("text")?.trim() || "";
    const userId = params.get("user_id");
    const teamId = params.get("team_id");
    const triggerId = params.get("trigger_id");
    const responseUrl = params.get("response_url");

    if (command !== "/momentum") {
      return NextResponse.json({ error: "Unknown command" }, { status: 400 });
    }

    // Parse subcommand
    const [subcommand, ...args] = text.split(" ");

    switch (subcommand.toLowerCase()) {
      case "":
      case "dashboard":
        return await handleDashboard(teamId!);

      case "signals":
        return await handleSignals(teamId!, args);

      case "stats":
        return await handleStats(teamId!);

      case "help":
        return handleHelp();

      default:
        return NextResponse.json({
          response_type: "ephemeral",
          text: `Unknown subcommand: \`${subcommand}\`. Try \`/momentum help\` for available commands.`,
        });
    }
  } catch (error) {
    console.error("Slack command error:", error);
    return NextResponse.json({
      response_type: "ephemeral",
      text: "An error occurred processing your command. Please try again.",
    });
  }
}

async function handleDashboard(teamId: string) {
  const stats = await convex.query(api.signals.getStats, {});

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Momentum Dashboard",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Total Signals*\n${stats.totalSignals}`,
        },
        {
          type: "mrkdwn",
          text: `*New Signals*\n${stats.newSignals}`,
        },
        {
          type: "mrkdwn",
          text: `*High Confidence*\n${stats.highConfidenceSignals}`,
        },
        {
          type: "mrkdwn",
          text: `*Urgent*\n${stats.urgentSignals}`,
        },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Signal Types*",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `:chart_with_upwards_trend: Expansion: ${stats.byType.expansion}` },
        { type: "mrkdwn", text: `:warning: Risk: ${stats.byType.risk}` },
        { type: "mrkdwn", text: `:moneybag: Buying Intent: ${stats.byType.buying_intent}` },
        { type: "mrkdwn", text: `:gear: Usage: ${stats.byType.usage}` },
        { type: "mrkdwn", text: `:rotating_light: Churn: ${stats.byType.churn}` },
        { type: "mrkdwn", text: `:busts_in_silhouette: Relationship: ${stats.byType.relationship}` },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View All Signals",
            emoji: true,
          },
          action_id: "view_all_signals",
          style: "primary",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Open Web Dashboard",
            emoji: true,
          },
          action_id: "open_dashboard",
          url: `${process.env.NEXT_PUBLIC_APP_URL || "https://thesimple.co"}/momentum`,
        },
      ],
    },
  ];

  return NextResponse.json({
    response_type: "ephemeral",
    blocks,
  });
}

async function handleSignals(teamId: string, args: string[]) {
  // Parse filter from args
  const filterType = args[0]?.toLowerCase();
  const validTypes = ["expansion", "risk", "buying_intent", "usage", "churn", "relationship"];

  let signals;
  if (filterType && validTypes.includes(filterType)) {
    signals = await convex.query(api.signals.listSignals, {
      signalType: filterType as "expansion" | "risk" | "buying_intent" | "usage" | "churn" | "relationship",
      limit: 5,
    });
  } else {
    signals = await convex.query(api.signals.listSignals, {
      status: "new",
      limit: 5,
    });
  }

  if (!signals || signals.length === 0) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "No signals found matching your criteria.",
    });
  }

  const signalTypeEmoji: Record<string, string> = {
    expansion: ":chart_with_upwards_trend:",
    risk: ":warning:",
    buying_intent: ":moneybag:",
    usage: ":gear:",
    churn: ":rotating_light:",
    relationship: ":busts_in_silhouette:",
  };

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: filterType ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)} Signals` : "New Signals",
        emoji: true,
      },
    },
    ...signals.flatMap((signal) => [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${signalTypeEmoji[signal.type] || ":bell:"} *${signal.type.replace("_", " ").toUpperCase()}* (${signal.confidence}% confidence)\n>${signal.text.slice(0, 150)}${signal.text.length > 150 ? "..." : ""}`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "View",
            emoji: true,
          },
          action_id: `view_signal_${signal._id}`,
          value: signal._id,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `${signal.channelName} | ${new Date(signal.createdAt).toLocaleDateString()}`,
          },
        ],
      },
      { type: "divider" },
    ]),
  ];

  return NextResponse.json({
    response_type: "ephemeral",
    blocks,
  });
}

async function handleStats(teamId: string) {
  const stats = await convex.query(api.signals.getStats, {});

  const total = stats.totalSignals || 1; // Prevent divide by zero

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Momentum Analytics",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Overall Statistics*\nTotal signals detected: *${stats.totalSignals}*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Status Breakdown*",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `:new: New: ${stats.byStatus.new} (${Math.round((stats.byStatus.new / total) * 100)}%)` },
        { type: "mrkdwn", text: `:white_check_mark: Handled: ${stats.byStatus.handled} (${Math.round((stats.byStatus.handled / total) * 100)}%)` },
        { type: "mrkdwn", text: `:x: Dismissed: ${stats.byStatus.dismissed} (${Math.round((stats.byStatus.dismissed / total) * 100)}%)` },
        { type: "mrkdwn", text: `:clock1: Snoozed: ${stats.byStatus.snoozed} (${Math.round((stats.byStatus.snoozed / total) * 100)}%)` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Signal Quality*",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `:dart: High Confidence (80%+): ${stats.highConfidenceSignals}` },
        { type: "mrkdwn", text: `:fire: Urgent Signals: ${stats.urgentSignals}` },
      ],
    },
  ];

  return NextResponse.json({
    response_type: "ephemeral",
    blocks,
  });
}

function handleHelp() {
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Momentum Help",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Available Commands*",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "`/momentum` or `/momentum dashboard`\nView the Momentum dashboard with key metrics",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "`/momentum signals [type]`\nView recent signals. Optionally filter by type:\n• `expansion` - Growth signals\n• `risk` - Risk indicators\n• `buying_intent` - Purchase interest\n• `usage` - Usage patterns\n• `churn` - Churn risk\n• `relationship` - Relationship changes",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "`/momentum stats`\nView detailed analytics and breakdown",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "`/momentum help`\nShow this help message",
      },
    },
    {
      type: "divider",
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Momentum automatically detects revenue signals in your Slack channels.",
        },
      ],
    },
  ];

  return NextResponse.json({
    response_type: "ephemeral",
    blocks,
  });
}
