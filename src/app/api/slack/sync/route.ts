import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { callSlackApi, SLACK_API_ENDPOINTS } from "@/lib/slack";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  is_bot: boolean;
  is_app_user: boolean;
  profile: {
    email?: string;
    real_name?: string;
    display_name?: string;
    title?: string;
    image_192?: string;
  };
}

interface SlackUsersListResponse {
  ok: boolean;
  members?: SlackUser[];
  response_metadata?: {
    next_cursor?: string;
  };
  error?: string;
}

// POST /api/slack/sync - Sync all Slack users to CRM contacts
export async function POST(request: NextRequest) {
  try {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Slack bot token not configured" },
        { status: 500 }
      );
    }

    const allUsers: SlackUser[] = [];
    let cursor: string | undefined;

    // Paginate through all users
    do {
      const params: Record<string, string> = { limit: "200" };
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await callSlackApi(
        SLACK_API_ENDPOINTS.USERS_LIST,
        token,
        "GET",
        params
      ) as SlackUsersListResponse;

      if (!response.ok) {
        return NextResponse.json(
          { error: `Slack API error: ${response.error}` },
          { status: 500 }
        );
      }

      if (response.members) {
        // Filter out deleted users, bots, and app users
        const activeUsers = response.members.filter(
          (user) => !user.deleted && !user.is_bot && !user.is_app_user
        );
        allUsers.push(...activeUsers);
      }

      cursor = response.response_metadata?.next_cursor;
    } while (cursor);

    // Transform to our format
    const usersToSync = allUsers.map((user) => ({
      slackUserId: user.id,
      slackTeamId: user.team_id,
      email: user.profile.email,
      realName: user.profile.real_name,
      displayName: user.profile.display_name,
      title: user.profile.title,
      avatarUrl: user.profile.image_192,
      isBot: user.is_bot,
    }));

    // Sync to Convex in batches of 50
    const batchSize = 50;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (let i = 0; i < usersToSync.length; i += batchSize) {
      const batch = usersToSync.slice(i, i + batchSize);
      const result = await convex.mutation(api.slackSync.bulkSyncSlackUsers, {
        users: batch,
      });
      totalCreated += result.created;
      totalUpdated += result.updated;
      totalSkipped += result.skipped;
    }

    return NextResponse.json({
      success: true,
      totalUsers: allUsers.length,
      created: totalCreated,
      updated: totalUpdated,
      skipped: totalSkipped,
    });
  } catch (error) {
    console.error("Slack sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync Slack users" },
      { status: 500 }
    );
  }
}

// GET /api/slack/sync - Get sync status
export async function GET() {
  try {
    const status = await convex.query(api.slackSync.getSyncStatus, {});
    return NextResponse.json(status);
  } catch (error) {
    console.error("Sync status error:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}
