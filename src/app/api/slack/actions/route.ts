import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { verifySlackSignature, callSlackApi, SLACK_API_ENDPOINTS } from "@/lib/slack";
import { Id } from "../../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const timestamp = request.headers.get("x-slack-request-timestamp") || "";
    const signature = request.headers.get("x-slack-signature") || "";

    // Verify request signature in production
    if (process.env.NODE_ENV === "production" && process.env.SLACK_SIGNING_SECRET) {
      const isValid = await verifySlackSignature(
        process.env.SLACK_SIGNING_SECRET,
        timestamp,
        body,
        signature
      );

      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Parse payload (URL encoded with payload= prefix)
    const params = new URLSearchParams(body);
    const payloadStr = params.get("payload");
    if (!payloadStr) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);
    const { type, actions, trigger_id, user, team, response_url, view } = payload;

    // Handle different interaction types
    switch (type) {
      case "block_actions":
        return await handleBlockActions(actions, trigger_id, user, team, response_url);

      case "view_submission":
        return await handleViewSubmission(view, user);

      case "shortcut":
        return await handleShortcut(payload);

      default:
        return NextResponse.json({ ok: true });
    }
  } catch (error) {
    console.error("Slack action error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleBlockActions(
  actions: Array<{ action_id: string; value?: string; selected_option?: { value: string } }>,
  triggerId: string,
  user: { id: string; name: string },
  team: { id: string },
  responseUrl: string
) {
  for (const action of actions) {
    const { action_id, value } = action;

    if (action_id === "view_all_signals") {
      // Fetch and display all new signals
      const signals = await convex.query(api.signals.listSignals, {
        status: "new",
        limit: 10,
      });

      await sendResponse(responseUrl, {
        replace_original: false,
        text: `Found ${signals.length} new signals. View them in the web dashboard.`,
      });
    }

    if (action_id.startsWith("view_signal_")) {
      const signalId = value as Id<"sentinelSignals">;
      const signal = await convex.query(api.signals.getSignal, { signalId });

      if (signal) {
        // Open a modal with signal details
        await openSignalModal(triggerId, signal);
      }
    }

    if (action_id === "mark_handled") {
      const signalId = value as Id<"sentinelSignals">;
      await convex.mutation(api.signals.updateSignalStatus, {
        signalId,
        status: "handled",
      });

      await sendResponse(responseUrl, {
        replace_original: false,
        text: ":white_check_mark: Signal marked as handled!",
      });
    }

    if (action_id === "dismiss_signal") {
      const signalId = value as Id<"sentinelSignals">;
      await convex.mutation(api.signals.updateSignalStatus, {
        signalId,
        status: "dismissed",
      });

      await sendResponse(responseUrl, {
        replace_original: false,
        text: ":x: Signal dismissed.",
      });
    }

    if (action_id === "snooze_signal") {
      const signalId = value as Id<"sentinelSignals">;
      await convex.mutation(api.signals.updateSignalStatus, {
        signalId,
        status: "snoozed",
        snoozedUntil: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });

      await sendResponse(responseUrl, {
        replace_original: false,
        text: ":clock1: Signal snoozed for 24 hours.",
      });
    }

    if (action_id === "create_opportunity") {
      const signalId = value as Id<"sentinelSignals">;
      // Open modal for creating opportunity
      await openCreateOpportunityModal(triggerId, signalId);
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleViewSubmission(
  view: { callback_id: string; private_metadata: string; state: { values: Record<string, Record<string, { value?: string; selected_option?: { value: string } }>> } },
  user: { id: string }
) {
  const { callback_id, private_metadata, state } = view;

  if (callback_id === "create_opportunity_modal") {
    const signalId = private_metadata as Id<"sentinelSignals">;
    const dealName = state.values.deal_name?.deal_name_input?.value || "New Opportunity";
    const dealValue = parseInt(state.values.deal_value?.deal_value_input?.value || "0", 10);

    await convex.mutation(api.signals.createOpportunityFromSignal, {
      signalId,
      dealName,
      value: dealValue,
    });

    return NextResponse.json({
      response_action: "clear",
    });
  }

  return NextResponse.json({ ok: true });
}

async function handleShortcut(payload: { callback_id: string; trigger_id: string; user: { id: string } }) {
  // Handle global shortcuts if needed
  return NextResponse.json({ ok: true });
}

async function openSignalModal(triggerId: string, signal: {
  _id: Id<"sentinelSignals">;
  type: string;
  text: string;
  confidence: number;
  sentiment?: string | null;
  channelName?: string;
  createdAt: number;
}) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return;

  const signalTypeEmoji: Record<string, string> = {
    expansion: ":chart_with_upwards_trend:",
    risk: ":warning:",
    buying_intent: ":moneybag:",
    usage: ":gear:",
    churn: ":rotating_light:",
    relationship: ":busts_in_silhouette:",
  };

  const view = {
    type: "modal",
    callback_id: "signal_detail_modal",
    private_metadata: signal._id,
    title: {
      type: "plain_text",
      text: "Signal Details",
    },
    close: {
      type: "plain_text",
      text: "Close",
    },
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${signalTypeEmoji[signal.type] || ":bell:"} ${signal.type.replace("_", " ").toUpperCase()}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Confidence*\n${signal.confidence}%`,
          },
          {
            type: "mrkdwn",
            text: `*Sentiment*\n${signal.sentiment || "neutral"}`,
          },
          {
            type: "mrkdwn",
            text: `*Channel*\n${signal.channelName || "Unknown"}`,
          },
          {
            type: "mrkdwn",
            text: `*Detected*\n${new Date(signal.createdAt).toLocaleString()}`,
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
          text: `*Original Message*\n>${signal.text}`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Mark Handled",
              emoji: true,
            },
            style: "primary",
            action_id: "mark_handled",
            value: signal._id,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Create Opportunity",
              emoji: true,
            },
            action_id: "create_opportunity",
            value: signal._id,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Snooze",
              emoji: true,
            },
            action_id: "snooze_signal",
            value: signal._id,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Dismiss",
              emoji: true,
            },
            style: "danger",
            action_id: "dismiss_signal",
            value: signal._id,
          },
        ],
      },
    ],
  };

  await callSlackApi(SLACK_API_ENDPOINTS.VIEWS_OPEN, token, "POST", {
    trigger_id: triggerId,
    view,
  });
}

async function openCreateOpportunityModal(triggerId: string, signalId: Id<"sentinelSignals">) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return;

  const view = {
    type: "modal",
    callback_id: "create_opportunity_modal",
    private_metadata: signalId,
    title: {
      type: "plain_text",
      text: "Create Opportunity",
    },
    submit: {
      type: "plain_text",
      text: "Create",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
    blocks: [
      {
        type: "input",
        block_id: "deal_name",
        element: {
          type: "plain_text_input",
          action_id: "deal_name_input",
          placeholder: {
            type: "plain_text",
            text: "Enter opportunity name",
          },
        },
        label: {
          type: "plain_text",
          text: "Opportunity Name",
        },
      },
      {
        type: "input",
        block_id: "deal_value",
        optional: true,
        element: {
          type: "plain_text_input",
          action_id: "deal_value_input",
          placeholder: {
            type: "plain_text",
            text: "Enter value (optional)",
          },
        },
        label: {
          type: "plain_text",
          text: "Deal Value ($)",
        },
      },
    ],
  };

  await callSlackApi(SLACK_API_ENDPOINTS.VIEWS_OPEN, token, "POST", {
    trigger_id: triggerId,
    view,
  });
}

async function sendResponse(responseUrl: string, payload: object) {
  await fetch(responseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
