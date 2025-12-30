# Claude Context for Convex CRM

## Project Overview

**Convex CRM** is a full-stack CRM application with AI-powered features. The main feature is **Momentum** - a Slack integration for revenue intelligence that captures buying signals from customer conversations.

**Tech Stack:**
- Next.js 14 (App Router)
- Convex (backend/database)
- TypeScript
- Tailwind CSS + shadcn/ui
- Deployed to Vercel at thesimple.co

## Momentum Feature (Complete)

Momentum is a Slack bot that monitors customer channels for revenue signals:
- **Expansion**: growth intent, upgrade requests, new team members
- **Risk**: complaints, frustration, support issues
- **Buying Intent**: pricing questions, demo requests, trial interest
- **Churn**: competitor mentions, cancellation signals
- **Relationship**: org changes, new hires, departures

### Component Status

| Component | Status | Location |
|-----------|--------|----------|
| Slack utilities | Complete | `src/lib/slack.ts` |
| Signal detection | Complete | `src/lib/slack.ts` |
| Database schema | Complete | `convex/schema.ts:1669-1874` |
| Convex functions | Complete | `convex/signals.ts` |
| API routes | Complete | `src/app/api/slack/` |
| Web dashboard | Complete | `src/app/(dashboard)/momentum/page.tsx` |
| UI Components | Complete | `src/components/momentum/` |
| Slack manifest | Complete | `SLACK_MANIFEST_MOMENTUM.json` |

### API Routes

- `POST /api/slack/events` - Receives Slack messages, stores all, creates signals
- `POST /api/slack/commands` - Handles `/momentum` slash command
- `POST /api/slack/actions` - Button clicks, modal submissions
- `GET /api/slack/oauth/callback` - OAuth flow for workspace install
- `POST /api/slack/sync` - Sync all Slack users to CRM contacts
- `GET /api/slack/sync` - Get sync status

### Slash Commands

- `/momentum` or `/momentum dashboard` - View stats dashboard
- `/momentum signals [type]` - List signals (filter by type)
- `/momentum stats` - Detailed analytics
- `/momentum help` - Command documentation

### Convex Functions (`convex/signals.ts`)

**Mutations:**
- `createSignalFromSlack` - Create signal from Slack event
- `updateSignalStatus` - Change signal status (handled/dismissed/snoozed)
- `saveWorkspace` - Save OAuth workspace credentials
- `createOpportunityFromSignal` - Mark signal for deal creation
- `linkSignalToContact` - Link signal to CRM contact/company

**Queries:**
- `listSignals` - List with filters (type, status, confidence)
- `getSignal` - Single signal with context
- `getStats` - Dashboard metrics
- `listWorkspaces` - Connected workspaces
- `getSignalsByContact` - Signals linked to a contact
- `getSignalsByCompany` - Signals linked to a company

### Convex Functions (`convex/slackSync.ts`)

**Mutations:**
- `syncSlackUserToContact` - Sync single Slack user to CRM contact
- `bulkSyncSlackUsers` - Batch sync Slack users
- `storeSlackMessage` - Store message with optional signal detection

**Queries:**
- `getContactBySlackUserId` - Find contact by Slack user ID
- `getSyncStatus` - Get sync statistics

### Slack Credentials (in `.env.local`)

```
NEXT_PUBLIC_SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
SLACK_SIGNING_SECRET=your_signing_secret
SLACK_BOT_TOKEN=your_bot_token
SLACK_APP_ID=your_app_id
```

### Database Tables

- `sentinelWorkspaces` - Slack workspace configs
- `sentinelChannels` - Monitored channels
- `sentinelMessages` - Raw Slack messages
- `sentinelSignals` - Processed signals with confidence scores
- `sentinelCustomers` - Customer/account mapping
- `sentinelRules` - Custom detection rules
- `sentinelSyncJobs` - External CRM sync queue
- `sentinelNotifications` - Notification tracking

### Key Files

```
src/app/api/slack/
  events/route.ts              # Message event handler
  commands/route.ts            # /momentum slash command
  actions/route.ts             # Button/modal interactions
  oauth/callback/route.ts      # OAuth callback

src/app/(dashboard)/momentum/
  page.tsx                     # Web dashboard

src/lib/slack.ts               # Slack API helpers, signal detection

src/components/momentum/
  momentum-stats.tsx           # Dashboard stats cards
  signal-card.tsx              # Signal list item
  signal-filters.tsx           # Filter panel
  signal-detail-modal.tsx      # Signal detail view

convex/signals.ts              # All signal-related functions
convex/schema.ts               # Database schema (sentinel* tables)

SLACK_MANIFEST_MOMENTUM.json   # Slack app config
```

### Testing

Test events locally with curl:
```bash
# Test signal detection
curl -X POST http://localhost:3000/api/slack/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "event_callback",
    "team_id": "T123TEST",
    "event": {
      "type": "message",
      "text": "We need to scale and add more seats",
      "user": "U123",
      "channel": "C123",
      "ts": "1234567890.000001"
    }
  }'

# Test slash command
curl -X POST http://localhost:3000/api/slack/commands \
  -d "command=/momentum&text=dashboard&user_id=U123&team_id=T123"
```

## Other CRM Features

- Customer management
- Deal/pipeline tracking
- Contact management
- Activity logging
- AI call summaries (ElevenLabs)
- Leaderboards with badges/streaks
- Forecasting
- Workflows

## Development Commands

```bash
npm run dev          # Start Next.js dev server
npx convex dev       # Start Convex dev server (or --once to push)
npm run build        # Production build
npm run lint         # Run linter
```

## Production

- URL: https://thesimple.co
- Hosting: Vercel
- Database: Convex Cloud

## Roadmap

### Complete
- **Slack Contact Sync** - Import Slack users as CRM contacts (via "Sync Contacts" button on Momentum page)
- **Contact Signals View** - View Slack signals linked to each contact under "Slack Signals" tab

### Planned
- **Slack DM Alerts** - Notify users via Slack DM when urgent/high-confidence buying signals are detected
- **Signal → Deal workflow** - Create deals directly from signals
- **Auto-link signals** - Match signals to contacts by email/name mentioned
- **Dashboard charts** - Visualize signal trends over time
