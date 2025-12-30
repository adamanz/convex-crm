# Convex CRM

A modern CRM application built with Next.js and Convex, featuring AI-powered revenue intelligence through Slack integration.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Convex (real-time database + serverless functions)
- **AI**: ElevenLabs (call summaries), keyword-based signal detection
- **Integrations**: Slack (Momentum)
- **Deployment**: Vercel

## Features

### Core CRM
- Customer management
- Deal/pipeline tracking
- Contact management
- Activity logging
- Leaderboards with gamification (badges, streaks)

### Momentum (Slack Integration) - In Development
AI-powered revenue intelligence that monitors Slack channels for:
- Expansion signals (growth, upgrades)
- Risk signals (complaints, issues)
- Buying intent (pricing, demos)
- Churn indicators (competitor mentions)
- Relationship changes (org changes)

See `CLAUDE.md` for detailed Momentum implementation status.

## Getting Started

### Prerequisites
- Node.js 18+
- Convex account
- Slack app (for Momentum)

### Environment Variables

Create `.env.local`:
```bash
# Convex
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Slack (Momentum)
NEXT_PUBLIC_SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=
SLACK_APP_ID=

# ElevenLabs (AI calls)
ELEVENLABS_API_KEY=
```

### Development

```bash
# Install dependencies
npm install

# Start Convex dev server (in one terminal)
npx convex dev

# Start Next.js dev server (in another terminal)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
  app/                    # Next.js App Router pages
  components/
    momentum/             # Slack signal components
    ui/                   # shadcn/ui components
  lib/
    slack.ts              # Slack API utilities
convex/
  schema.ts               # Database schema
  *.ts                    # Convex functions
```

## Deployment

Deployed on Vercel at https://thesimple.co

```bash
npm run build
vercel --prod
```

## Documentation

- `CLAUDE.md` - Detailed context for AI assistants (project state, what's built, what's needed)
- `SLACK_MANIFEST_MOMENTUM.json` - Slack app configuration
