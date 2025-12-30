import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { exchangeOAuthCode } from "@/lib/slack";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Handle OAuth errors
  if (error) {
    console.error("Slack OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/momentum?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate code
  if (!code) {
    return NextResponse.redirect(
      new URL("/momentum?error=missing_code", request.url)
    );
  }

  try {
    // Exchange code for token
    const result = await exchangeOAuthCode(code);

    if (!result.ok) {
      console.error("Slack OAuth token exchange failed:", result.error);
      return NextResponse.redirect(
        new URL(`/momentum?error=${encodeURIComponent(result.error || "token_exchange_failed")}`, request.url)
      );
    }

    // Save workspace to Convex
    await convex.mutation(api.signals.saveWorkspace, {
      slackTeamId: result.team?.id || "",
      slackTeamDomain: result.team?.name,
      slackBotUserId: result.bot_user_id || "",
      encryptedBotToken: result.access_token || "", // In production, encrypt this
      installedBy: result.authed_user?.id || "",
    });

    console.log(`Slack workspace connected: ${result.team?.name} (${result.team?.id})`);

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/momentum?success=connected", request.url)
    );
  } catch (error) {
    console.error("Slack OAuth error:", error);
    return NextResponse.redirect(
      new URL("/momentum?error=internal_error", request.url)
    );
  }
}
