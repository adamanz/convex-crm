# Momentum: Quick Start (5 Minutes)

Get Momentum running in 5 minutes.

---

## Step 1: Create Slack App (2 min)

1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From an app manifest"**
3. Paste the manifest from `MOMENTUM_SLACK_SETUP.md` (change domain to `localhost:3000`)
4. Click **"Create"**

---

## Step 2: Get Credentials (1 min)

In your new Slack app:

1. Go to **"Basic Information"**
2. Copy these three values:
   - **Client ID** (starts with `xoxb-`)
   - **Client Secret** (keep secret!)
   - **Signing Secret**

3. Go to **"OAuth & Permissions"**
4. Scroll to **"OAuth Tokens for Your Workspace"**
5. Copy **Bot User OAuth Token** (starts with `xoxb-`)

---

## Step 3: Set Environment Variables (1 min)

Create/edit `/.env.local`:

```bash
NEXT_PUBLIC_SLACK_CLIENT_ID=xoxb-your-client-id
SLACK_CLIENT_SECRET=xoxb-your-client-secret
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_REDIRECT_URI=http://localhost:3000/api/slack/oauth/callback
NEXT_PUBLIC_CONVEX_URL=https://your-team.convex.cloud
```

---

## Step 4: Start Development Server (1 min)

```bash
# Terminal 1: Start Next.js and Convex
cd /Users/adamanz/convex-crm
npm run dev

# Terminal 2: Optional - Watch Convex logs
npx convex dev
```

---

## Step 5: Test OAuth Flow (1 min)

1. Open: **http://localhost:3000/api/slack/oauth/authorize**
2. You'll be redirected to Slack
3. Click **"Allow"**
4. You should be redirected back (success!)

Check Convex database:
```bash
npx convex dashboard
```

Navigate to `sentinelWorkspaces` table - you should see your workspace connected.

---

## Step 6: Test Message Detection

1. Go to your Slack workspace
2. Send message in any channel:
   ```
   We're running out of capacity
   ```
3. Check `sentinelSignals` in Convex dashboard
4. You should see a signal created with type="expansion"

---

## ✅ You're Done!

Momentum is now:
- ✅ Connected to your Slack workspace
- ✅ Listening for messages
- ✅ Detecting signals from keywords
- ✅ Storing them in Convex database

---

## What's Next?

See `MOMENTUM_IMPLEMENTATION_SUMMARY.md` for:
- Full implementation details
- Database schema
- API endpoints
- Troubleshooting

See `MOMENTUM_SPEC.md` for:
- Product roadmap
- Phase 2 features (dashboard, Salesforce sync)
- Go-to-market strategy

---

## Test Different Signals

Try sending these messages to see different signal types:

```
📈 Expansion: "We need to scale to 50 more users"
🔴 Risk: "This is completely broken and frustrating"
💰 Buying Intent: "How much would this cost for our team?"
📊 Usage: "We've rolled out your tool to our entire org"
⚠️  Churn: "We're considering switching to a competitor"
👥 Relationship: "Our new CTO just joined"
```

Check `sentinelSignals` table to see signals created!

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| OAuth redirect fails | Check `NEXT_PUBLIC_SLACK_CLIENT_ID` is correct |
| "Invalid state parameter" | Clear browser cookies and try again |
| Messages not detected | Check keywords in `src/lib/slack.ts` |
| No signals created | Check channel `isMonitored = true` in Convex |
| Convex errors | Run `npx convex dev` and check logs |

---

## API Endpoints

- `GET /api/slack/oauth/authorize` - Start OAuth
- `GET /api/slack/oauth/callback` - OAuth callback (auto)
- `POST /api/slack/events` - Slack webhook (auto)

All are set up and ready to go!

---

**Time to first signal: 5 minutes** ⚡

Next up: Dashboard to view signals (Phase 2)
