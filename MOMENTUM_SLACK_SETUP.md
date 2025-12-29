# Momentum: Slack Setup Guide

Complete guide to set up Slack OAuth integration for Momentum (Slack-to-CRM Intelligence).

---

## Table of Contents

1. [Create Slack App](#create-slack-app)
2. [Configure OAuth Settings](#configure-oauth-settings)
3. [Subscribe to Events](#subscribe-to-events)
4. [Set Environment Variables](#set-environment-variables)
5. [Test the Integration](#test-the-integration)
6. [Troubleshooting](#troubleshooting)

---

## Create Slack App

### Step 1: Go to Slack App Directory

1. Navigate to https://api.slack.com/apps
2. Click **"Create New App"** button (top right)
3. Choose **"From an app manifest"** (recommended)

### Step 2: Create from Manifest

Paste this manifest (replacing `YOUR_DOMAIN_HERE` with your actual domain):

```json
{
  "display_information": {
    "name": "Momentum",
    "description": "AI-powered sales intelligence from Slack",
    "background_color": "#2C2D30"
  },
  "features": {
    "bot_user": {
      "display_name": "Momentum",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:manage",
        "channels:read",
        "chat:write",
        "chat:write.customize",
        "commands",
        "dnd:read",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "links:read",
        "metadata.message:read",
        "mpim:history",
        "mpim:read",
        "pins:read",
        "reactions:read",
        "reminders:read",
        "reminders:write",
        "team:read",
        "users:read",
        "users.profile:read",
        "workflow.steps:execute"
      ]
    },
    "redirect_urls": [
      "http://localhost:3000/api/slack/oauth/callback",
      "https://YOUR_DOMAIN_HERE/api/slack/oauth/callback"
    ]
  },
  "event_subscriptions": {
    "request_url": "https://YOUR_DOMAIN_HERE/api/slack/events",
    "bot_events": [
      "app_mention",
      "message.channels",
      "message.groups",
      "message.im",
      "message.mpim",
      "team_join",
      "user_change"
    ]
  },
  "settings": {
    "org_deploy_enabled": false,
    "socket_mode_enabled": false,
    "token_rotation_enabled": false
  }
}
```

Click **"Create"** to create the app from manifest.

---

## Configure OAuth Settings

### Step 1: Get Your Credentials

1. In your app, go to **"OAuth & Permissions"** (left sidebar)
2. Scroll down to **"OAuth Tokens for Your Workspace"**
3. You'll see:
   - **Bot User OAuth Token** (starts with `xoxb-`)
   - **User OAuth Token** (starts with `xoxp-`)

We only need the **Bot User OAuth Token**. Copy this value.

### Step 2: Get Client ID and Client Secret

1. Go to **"Basic Information"** (left sidebar, top section)
2. In the **"App Credentials"** section, you'll see:
   - **Client ID**
   - **Client Secret**
   - **Signing Secret**

Copy all three values.

### Step 3: Update Redirect URIs

1. Go back to **"OAuth & Permissions"**
2. Scroll to **"Redirect URLs"**
3. Update the URLs to match your deployment:
   - **Local development**: `http://localhost:3000/api/slack/oauth/callback`
   - **Production**: `https://yourdomain.com/api/slack/oauth/callback`

Click **"Save URLs"**

---

## Subscribe to Events

### Step 1: Configure Event Subscriptions

1. In your app, go to **"Event Subscriptions"** (left sidebar)
2. Toggle **"Enable Events"** to **ON**
3. In **"Request URL"**, enter:
   - **Local**: `http://localhost:3000/api/slack/events`
   - **Production**: `https://yourdomain.com/api/slack/events`

When you enter the URL, Slack will send a verification challenge. Your endpoint must respond with the `challenge` value to verify.

### Step 2: Subscribe to Bot Events

1. Scroll down to **"Subscribe to bot events"**
2. Make sure these events are selected:
   - `message.channels` - Messages in public channels
   - `message.groups` - Messages in private channels
   - `message.im` - Direct messages
   - `app_mention` - When the app is mentioned

3. Click **"Save Changes"**

---

## Set Environment Variables

### Step 1: Create `.env.local` File

In the root of your project, create `.env.local` with:

```bash
# Convex (already configured)
NEXT_PUBLIC_CONVEX_URL=https://your-team.convex.cloud

# Slack OAuth Credentials (from "Basic Information")
NEXT_PUBLIC_SLACK_CLIENT_ID=xoxb-your-client-id-here
SLACK_CLIENT_SECRET=xoxb-your-client-secret-here
SLACK_SIGNING_SECRET=your-signing-secret-here

# Slack OAuth Redirect URI
SLACK_REDIRECT_URI=http://localhost:3000/api/slack/oauth/callback
```

### Step 2: For Production Deployment

When deploying to production (e.g., Vercel):

1. Go to your deployment platform (Vercel, Heroku, etc.)
2. Add these environment variables in your project settings:
   - `NEXT_PUBLIC_SLACK_CLIENT_ID` (same as local)
   - `SLACK_CLIENT_SECRET` (same as local)
   - `SLACK_SIGNING_SECRET` (same as local)
   - `SLACK_REDIRECT_URI=https://yourdomain.com/api/slack/oauth/callback`
   - `NEXT_PUBLIC_CONVEX_URL` (your production Convex URL)

---

## Test the Integration

### Step 1: Start the Development Server

```bash
cd /Users/adamanz/convex-crm
npm run dev
```

This should start:
- Next.js dev server on `http://localhost:3000`
- Convex dev environment

### Step 2: Test OAuth Flow

1. Go to: `http://localhost:3000/api/slack/oauth/authorize`
2. You'll be redirected to Slack's authorization page
3. Click **"Allow"** to authorize the app
4. You should be redirected back to your app

### Step 3: Test Event Listener

1. Go to your Slack workspace
2. In any channel, create a message like:
   - "We need more capacity"
   - "Budget just got cut"
   - "How much does it cost to scale?"
3. Check your Convex database to see if signals are being created

To view Convex data:
```bash
npx convex dashboard
```

Then navigate to the `sentinelMessages` and `sentinelSignals` tables.

---

## Troubleshooting

### OAuth Flow Issues

**Problem**: Redirect to Slack fails
- **Solution**: Check that `NEXT_PUBLIC_SLACK_CLIENT_ID` is correct and matches your app's Client ID

**Problem**: Callback returns "Invalid state parameter"
- **Solution**: Make sure cookies are enabled in your browser
- **Solution**: Check that `SLACK_REDIRECT_URI` matches exactly in both `.env.local` and Slack app settings

**Problem**: OAuth succeeds but workspace doesn't save
- **Solution**: Check Convex database connection with `npx convex dashboard`
- **Solution**: Check server logs for "Error processing OAuth callback"

### Event Listener Issues

**Problem**: "Request URL failed" in Slack Event Subscriptions
- **Solution**: Your `/api/slack/events` endpoint must be publicly accessible and respond to Slack's verification challenge
- **Solution**: For local development, use `ngrok` or `localtunnel` to expose local server to internet:
  ```bash
  # Install ngrok
  npm install -g ngrok

  # Start ngrok tunnel
  ngrok http 3000

  # Use the HTTPS URL from ngrok in Slack settings
  # e.g., https://abc123.ngrok.io/api/slack/events
  ```

**Problem**: Messages not creating signals
- **Solution**: Check that channel is in `sentinelChannels` table with `isMonitored = true`
- **Solution**: Check message text has keywords from `SIGNAL_KEYWORDS` in `src/lib/slack.ts`
- **Solution**: Review Convex function logs: `npx convex dev` will show errors

**Problem**: "Signing secret missing" error
- **Solution**: Check that `SLACK_SIGNING_SECRET` is set in `.env.local`
- **Solution**: Verify it's the correct value from Slack app's "Basic Information" page

---

## What Happens After OAuth

Once a workspace is authorized:

1. **Workspace record created** in `sentinelWorkspaces` table
2. **Bot token stored** (encrypted) for API calls
3. **Channels synced** from Slack to `sentinelChannels` (next feature)
4. **Messages monitored** from configured channels
5. **Signals created** when keywords are detected

---

## Next Steps

1. ✅ Slack OAuth setup (this guide)
2. ⏳ Add channel configuration UI
3. ⏳ Sync Salesforce opportunities from signals
4. ⏳ Build dashboard to view signals
5. ⏳ Create notification system

---

## Useful Links

- [Slack API Documentation](https://api.slack.com)
- [Slack OAuth Documentation](https://api.slack.com/authentication/oauth-v2)
- [Slack Events API](https://api.slack.com/events)
- [Slack App Manifest](https://api.slack.com/reference/manifests)

---

## Getting Help

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review Slack app logs: `https://api.slack.com/apps/YOUR_APP_ID/event-logs`
3. Check Convex logs: `npx convex dev`
4. Check browser console: Right-click → Inspect → Console tab

---

**Last Updated**: December 28, 2025
