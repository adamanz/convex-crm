# MOMENTUM: Pylon for Sales

**Slack-to-CRM Intelligence Platform for Identifying Upsell Opportunities & Churn Risk**

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Product Spec](#product-spec)
3. [Architecture & Data Flows](#architecture--data-flows)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Tech Stack](#tech-stack)
6. [Go-to-Market](#go-to-market)

---

## Problem Statement

### The Sales Intelligence Gap

#### Current State

- Sales teams rely on scheduled calls, email, and manual CRM updates to understand customer health
- Critical signals are scattered across Slack channels, DMs, and emails—most never make it to the CRM
- By the time a rep realizes an account is at risk or has upsell potential, it's often too late
- Customer success, support, and engineering discussions reveal gold (expansion needs, pain points, churn signals) that sales never sees
- Sales reps waste time manually logging activities and miss real-time signals that could accelerate deals

#### The Cost

- **30-40% of upsell opportunities missed** because reps don't know about new customer needs discussed in Slack
- **Delayed churn intervention** – risk signals go unnoticed until renewal is in jeopardy
- **Manual CRM logging** consumes 5-10 hours/week per rep (that's 10-15% of productive selling time)
- **Account teams misaligned** – each function (CS, Support, Sales) has different context about the same customer

#### Why This Matters

Slack is the operational nervous system of modern B2B companies. Everything important happens there first—before it becomes a formal ticket, email, or CRM record. **Sales teams that can read this signal in real-time have a massive competitive advantage.**

---

## Product Spec

### Core Concept

Momentum monitors your Slack workspace to automatically detect, enrich, and surface:

- **Sales Signals**: Buying intent, new needs, expansion opportunities
- **Risk Indicators**: Churn warnings, escalations, dissatisfaction
- **Account Intelligence**: What's actually happening with each customer in real-time
- **Action Items**: Automatic recommendations for follow-up, context, next steps

---

### 1. Signal Detection Layer

#### 1.1 Signal Types

| Signal Category | Examples | CRM Action |
|---|---|---|
| **Expansion Signals** | "We need better reporting", "Can we do X?", "New team joining" | Create upsell opportunity |
| **Risk Indicators** | "Can't get this to work", "Considering alternatives", "Budget cut" | Flag account health, trigger risk workflow |
| **Buying Intent** | "How much would it cost to...", "When can we upgrade?", "Need to scale" | Create deal, alert sales |
| **Usage Signals** | "Using feature X heavily", "Integrated with Y", "Rolled out to Z people" | Update product adoption data |
| **Relationship Signals** | New champion, decision-maker change, org changes | Alert to key contact changes |
| **Churn Warnings** | Low engagement, migration discussion, compliance issues | Trigger retention playbook |

#### 1.2 Detection Methods

- **Keyword/Semantic Detection**: "We need a better...", "Can you help with...", "Budget cuts", "Switching to..."
- **Channel Monitoring**: `#customer-[account-name]`, `#support-requests`, `#product-feedback`, `#escalations`, `#customer-success`
- **Participant Analysis**: Who's talking? (customer success, engineering, multiple decision-makers)
- **Sentiment Analysis**: Frustration, excitement, urgency in conversations
- **Time-based Patterns**: Unusual activity spikes, silence from usually-active accounts

---

### 2. Data Enrichment

Each detected signal gets enriched with:

- **Account Mapping**: Which customer/account does this relate to?
- **Context Window**: Last 10 messages for full conversation context
- **Participants**: Who said it? (CS manager, support rep, customer contact, exec)
- **Sentiment Score**: Positive/neutral/negative/urgent
- **Confidence Level**: How likely is this a real signal? (0-100%)
- **Related Records**: Link to past signals, opportunities, tickets about this account
- **Recommended Action**: "Create expansion opportunity", "Alert CSM", "Schedule call", etc.

---

### 3. Core Features

#### 3.1 Real-Time Alert Dashboard

```
Momentum Home Feed:
├─ High-Priority Signals (Last 24hrs)
│  └─ Acme Corp: "We're running out of capacity" [Expansion] ⚡ 95% confidence
│  └─ TechFlow Inc: "Can't get support to respond" [Risk] 🔴 87% confidence
│  └─ GrowthCo: "How much to add 50 users?" [Deal] 🟢 92% confidence
├─ By Account (filterable)
│  └─ Acme Corp (Last signal: 2 hours ago)
│  └─ TechFlow Inc (Last signal: 3 days ago)
├─ By Signal Type (with counts)
└─ By Sales Rep (assigned accounts)
```

#### 3.2 Slack Integration

- **Momentum Bot**: Responds to questions in Slack, tags relevant people
- **Channel Monitoring**: Auto-joins `#customer-[name]`, `#support`, `#escalations`
- **Smart Tagging**: `/sentinel tag @customer_name` to link conversations
- **Notifications**: Deliver alerts directly in DM or shared channel
- **Actions in Slack**: Snooze, dismiss, "I'll handle this", assign to teammate

#### 3.3 CRM Sync (Salesforce/HubSpot)

- Auto-create opportunities from expansion signals
- Update account health/risk scores based on signal recency/severity
- Create activities/tasks for sales reps (linked to Slack conversation)
- Sync back: "This signal was converted to a deal" or "Rep already following up"
- Prevent duplicates: Don't create 5 opportunities for same signal

#### 3.4 Account Intelligence View

For each account, show:

- **Signal Timeline**: All detected signals over time (last 30/60/90 days)
- **Activity Pulse**: How much is this account being discussed in Slack?
- **Key Themes**: "Security concerns", "Scaling", "Integration questions"
- **People Involved**: CS rep, support contacts, customers, champions
- **Action Items**: Open opportunities, pending follow-ups, at-risk renewals

#### 3.5 AI-Powered Recommendations Engine

- "TechFlow Inc's silence (no Slack activity in 10 days) + last signal was frustrated = High risk"
- "Acme has asked about 'security' 3x in last month + 50% feature adoption = Ready for expansion convo"
- "GrowthCo asking about scaling + hiring 20 people + budget talk = Likely to expand in Q2"
- "CustomerX: Competitor mention + 'alternatives' conversation + support escalation = Define churn risk"

---

### 4. Rules Engine

Teams customize detection and actions:

```
Rule: "Expansion Opportunity"
  When: Slack message contains ["need more", "capacity", "scale", "users"]
        AND confidence > 80%
        AND from customer/contact
  Then: Create Salesforce opportunity
        Set stage: "Qualification"
        Priority: High
        Notify: Account executive + CSM

Rule: "Churn Warning"
  When: Sentiment = negative
        AND contains ["switch", "alternative", "budget cut", "pause"]
        AND account health = declining
  Then: Create Salesforce task
        Assign to: VP Sales
        Category: "High Risk"
        Due: Today
        Notify: CSM in Slack immediately

Rule: "Dead Account Detection"
  When: No Slack activity for 60 days
        AND last signal was 6+ months ago
        AND renewal within 90 days
  Then: Add to "Dormant Accounts" queue
        Alert CSM + AE
        Suggest: "Time for exec check-in call"
```

---

### 5. User Roles & Workflows

#### Sales Rep

- Views "My Signals" dashboard (accounts assigned to them)
- Gets Slack notifications: "Hey, Acme just mentioned scaling—read signal?"
- One-click actions: "I'm handling this" → auto-creates task + adds context
- Uses signal context in discovery calls: "I saw you mentioned X in Slack..."

#### CSM/Account Manager

- Views all signals for their accounts
- Can dismiss false positives or confirm signals
- Collaborates with Sales via Slack: "I can confirm expansion interest—want to jump on call?"
- Tracks "Helped close" upsells (feedback loop)

#### Sales Manager

- Views team dashboard: "5 signals this week, 2 converted to opportunities"
- Coaching view: "High-intent signal from TechFlow—rep hasn't followed up yet"
- Pipeline view: Signals → Opportunities conversion rate
- Forecast impact: "These 12 signals could add $500K to pipeline"

#### RevOps/Admin

- Configure Slack channels to monitor
- Set up detection rules and customizations
- Map Slack customer identifiers → CRM accounts (automation + manual)
- Monitor Momentum health: false positive rates, coverage, accuracy

---

### 6. Critical Success Metrics

#### User Metrics

- **Signal Accuracy**: % of signals that sales reps confirm as genuine opportunities
- **Action Rate**: % of signals with sales action taken within 7 days
- **Conversion Rate**: % of signals that become opportunities/deals
- **Time to Action**: Hours from signal detection to rep outreach
- **Revenue Impact**: $ closed from signal-originated opportunities

#### Product Metrics

- **Detection Coverage**: % of real upsell/risk signals being caught
- **False Positive Rate**: % of signals that are noise (keep <15%)
- **CRM Sync Accuracy**: % of created opportunities that actually exist
- **Duplicate Prevention**: % of duplicate opportunities prevented

---

## Architecture & Data Flows

```
┌─────────────────────────────────────────────────────────────┐
│                        Slack Workspace                       │
│  (Customer channels, support, escalations, DMs)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
         ┌─────────────────────┐
         │  Momentum Bot       │
         │  - Listen to events │
         │  - Parse messages   │
         │  - Extract entities │
         └──────────┬──────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│     Signal Detection & Enrichment       │
│  - Keyword detection                    │
│  - Sentiment analysis                   │
│  - Account mapping                      │
│  - Confidence scoring                   │
└──────────────┬──────────────────────────┘
               │
               ├─→ [Deduplication] (prevent duplicates within 24hrs)
               │
               ↓
    ┌──────────────────────┐
    │  Momentum Database   │
    │  - Signal log        │
    │  - Account history   │
    │  - User preferences  │
    └──────────┬───────────┘
               │
               ├─→ [Rules Engine]
               │   - Trigger custom workflows
               │   - Route to specific people
               │
               ├─→ [CRM Sync Layer]
               │   - Create/update opportunities
               │   - Add activities
               │   - Update health scores
               │
               └─→ [Dashboard & Notifications]
                   - Real-time alerts
                   - Slack DMs
                   - Email digest
```

---

## Implementation Roadmap

### Phase 1: MVP (4-6 weeks)

**Goal**: Prove signal detection works, basic CRM sync

**Features:**
- Momentum bot monitors 2-3 customer channels per Slack workspace
- Detects 5 core signal types (expansion, risk, buying intent, usage, churn)
- Manual account mapping (admin enters customer names ↔ Slack channels)
- Creates Salesforce tasks for detected signals
- Basic dashboard showing signals from last 7 days
- Slack DM notifications to sales rep (polled once daily)

**Technical:**
- Node.js backend, PostgreSQL, Slack API, Salesforce REST API
- Keyword-based detection (no ML yet)
- Simple confidence scoring (keywords + channel + sentiment)

**Metrics:** Detection accuracy, false positive rate, signal-to-action rate

---

### Phase 1 Detailed Breakdown

#### Week 1: Foundation & Slack Integration

**Goal:** Connect to Slack, start receiving messages

```
├─ Set up project structure
│  ├─ TypeScript + Node.js/Express monorepo
│  ├─ PostgreSQL schema: signals, channels, customers, accounts, rules
│  └─ Environment configuration (dev, staging, prod)
│
├─ Slack Integration
│  ├─ OAuth app setup (request scopes: channels:read, messages:read, users:read, chat:write)
│  ├─ Install bot to workspace → get workspace ID
│  ├─ Subscribe to message events (message.channels, message.im)
│  ├─ Store Slack workspace metadata (channels, users, team info)
│  └─ Test: Bot receives messages from test channel
│
└─ Database Schema v1
   ├─ channels (slack_channel_id, workspace_id, customer_id, created_at)
   ├─ signals (signal_id, workspace_id, channel_id, message_ts, raw_text, type, confidence, customer_id, created_at)
   ├─ customers (customer_id, workspace_id, slack_customer_name, crm_account_id)
   └─ users (slack_user_id, workspace_id, email, role, preferences)
```

#### Week 2: Signal Detection Engine

**Goal:** Detect 5 signal types from raw messages

```
├─ Keyword Dictionary
│  ├─ Expansion signals: ["need more", "capacity", "scale", "growth", "increase users", "new team"]
│  ├─ Risk signals: ["can't work", "frustrated", "bug", "support slow", "alternatives", "budget cut"]
│  ├─ Buying intent: ["how much", "cost", "upgrade", "pricing", "demo", "when available"]
│  ├─ Usage signals: ["using X heavily", "integrated with Y", "rolled out to"]
│  └─ Churn signals: ["pause", "migrate", "competitor", "contract over", "not working"]
│
├─ Detection Logic (Keyword Matching)
│  ├─ For each message:
│  │  ├─ Lowercase text, remove punctuation
│  │  ├─ Check against each keyword dictionary
│  │  ├─ Count matches → base_score
│  │  ├─ Apply channel boost (customer channel = 1.2x, support = 1.5x)
│  │  ├─ Apply sender boost (customer = 2.0x, internal = 1.0x)
│  │  └─ Final confidence = base_score / total_words, cap at 100%
│  │
│  └─ Output: signal_type, confidence (0-100), context_window (message + 2 before/after)
│
├─ Sentiment Layer (Simple Rule-Based)
│  ├─ Negative words: ["hate", "frustrated", "broken", "doesn't work"]
│  ├─ Positive words: ["awesome", "love", "great", "saved us"]
│  ├─ Calculate sentiment_score (-1 to +1)
│  └─ Store: { signal_id, sentiment_score, has_negation }
│
├─ Account Mapping (Manual in Phase 1)
│  ├─ Admin: "/sentinel config TechFlow #techflow-customer"
│  ├─ Storage: Map Slack channel → customer_id
│  ├─ During detection: Extract customer_id from channel_id
│  │
│  └─ Fallback: Fallback for unmapped channels (manual tagging in UI)
│
└─ Deduplication (Prevent noise)
   ├─ Rule: Don't create duplicate signal if:
   │  ├─ Same keyword detected in same channel < 24 hours apart
   │  ├─ Confidence < 50% (filter low-confidence noise)
   │  └─ System asks: "Is this new signal or continuation of last one?"
   └─ Store: signal_id, parent_signal_id (for grouping)
```

#### Week 3: Basic Dashboard & Notifications

**Goal:** Sales reps see signals, can take action

```
├─ Dashboard
│  ├─ React app, simple layout
│  ├─ Page 1: Feed
│  │  ├─ "New Signals (Last 7 days)" list
│  │  ├─ For each signal:
│  │  │  ├─ "[Expansion] Acme Corp: 'Need more capacity'" - 89% confidence
│  │  │  ├─ "Posted 2 hours ago by support@acme.com in #acme-customer"
│  │  │  ├─ Context window (prev messages)
│  │  │  ├─ Button: "Create opportunity" / "Mark handled" / "Snooze"
│  │  │  └─ Link to Slack conversation
│  │  │
│  │  └─ Filters: By signal type, by account, by confidence
│  │
│  ├─ Page 2: Accounts
│  │  ├─ Table: Account, Last Signal, Days Ago, Signal Count (7d)
│  │  ├─ Click account → detail view (next week)
│  │  └─ Status: Green (active), Yellow (stale), Red (risk)
│  │
│  └─ Auth: OAuth → Slack, Maps Slack ID → Salesforce user
│
├─ Slack Notifications (Daily Digest)
│  ├─ 9am: "You have 3 high-confidence signals in your accounts"
│  ├─ Link to dashboard
│  ├─ Quick summary: "Acme (expansion), TechFlow (risk), GrowthCo (buying intent)"
│  │
│  └─ Store notification preferences per user
│
└─ Emails
   ├─ Weekly digest (Monday 9am)
   ├─ "This week: 5 signals detected"
   ├─ By account, with links
   └─ Unsubscribe option
```

#### Week 4: Salesforce Integration (Basic)

**Goal:** Create tasks/activities from signals

```
├─ Salesforce OAuth Setup
│  ├─ Configure Salesforce connected app
│  ├─ Get org ID, client ID, client secret
│  ├─ Redirect URI: https://sentinel.app/auth/salesforce/callback
│  └─ Scopes: api, chatter, full
│
├─ Account Mapping v2 (Slack → Salesforce)
│  ├─ Admin imports Salesforce accounts (via REST API)
│  ├─ Manual mapping: "acme-slack-channel-name" → "Acme Corp (Acme Inc) - Salesforce Account ID"
│  ├─ Store in: account_mappings table
│  ├─ Check during signal detection: Find SalesforceAccountId from channel
│  └─ Fallback: If not found, store signal but mark as "unmapped"
│
├─ Create Salesforce Activities
│  ├─ On signal creation, if confidence > 70%:
│  │  ├─ Create Salesforce Task
│  │  ├─ Subject: "[SIGNAL] TechFlow: Need more capacity"
│  │  ├─ Description: "[Expansion Signal]\nMessage: 'We need more capacity...'\nChannel: #techflow-customer\nPosted by: John Smith (john@techflow.com)\nLink: [Click here]"
│  │  ├─ WhoId: Associated contact (if found, else account owner)
│  │  ├─ WhatId: Account ID
│  │  ├─ Type: "Call"
│  │  ├─ Status: "Open"
│  │  ├─ Due Date: Today
│  │  ├─ Priority: "High"
│  │  └─ Custom field: sentinel_signal_id (for linking back)
│  │
│  └─ Store: sfdc_task_id in signals table for tracking
│
├─ Handle Errors
│  ├─ If Salesforce API fails: Log error, retry with exponential backoff
│  ├─ If account not found: Store signal as "unmapped", admin fixes later
│  └─ Monitoring: Alert if >10% of signals fail to sync
│
└─ Testing
   ├─ Unit tests: Signal detection (keyword matching, confidence scoring)
   ├─ Integration test: Create signal → verify in Salesforce
   └─ E2E test: Full workflow (Slack message → Task in Salesforce)
```

#### Week 5: Admin Panel & Configuration

**Goal:** Teams can configure Momentum for their needs

```
├─ Admin Pages (React)
│  ├─ Workspace Settings
│  │  ├─ Connected Slack workspace info
│  │  ├─ Connected Salesforce org info
│  │  ├─ Re-authorize buttons
│  │  └─ Status: all systems healthy / errors
│  │
│  ├─ Channel Configuration
│  │  ├─ Table: Slack Channel → Customer Name → Salesforce Account
│  │  ├─ "Add channel" button: Show all unmonitored channels
│  │  ├─ Match Slack channel to Salesforce account (dropdown)
│  │  ├─ Bulk import from spreadsheet
│  │  └─ Auto-suggest based on name similarity (future)
│  │
│  ├─ Signal Rules (Simple Version)
│  │  ├─ Edit keyword dictionaries
│  │  ├─ Add/remove keywords per signal type
│  │  ├─ Adjust channel confidence boosts
│  │  └─ Adjust sender type boosts
│  │
│  └─ Users & Permissions
│     ├─ List workspace users
│     ├─ Assign "sales rep", "admin", "manager" roles
│     ├─ Set notification preferences
│     └─ See API key (for future integrations)
│
└─ Bulk Operations
   ├─ Import customers from CSV
   ├─ Map Slack channels in bulk
   └─ Reset/reimport all data
```

#### Week 6: Polish, Testing, Launch

**Goal:** Production-ready MVP

```
├─ Performance & Scaling
│  ├─ Can handle 1000 messages/minute per workspace
│  ├─ Cache frequent queries (Redis)
│  ├─ Database indexes on: (workspace_id, created_at), (customer_id), (slack_channel_id)
│  └─ Use queue (Bull/BullMQ) for Slack→Salesforce sync (decouple from API latency)
│
├─ Reliability
│  ├─ Slack webhook signature validation (prevent spoofing)
│  ├─ Exponential backoff for failed API calls
│  ├─ Dead letter queue for failed signals
│  ├─ Monitoring: Datadog / CloudWatch for errors, latency
│  └─ Alerts: Page on-call if >5% signal failures
│
├─ Security
│  ├─ Encrypt Slack & Salesforce tokens in database
│  ├─ Rate limiting on API endpoints
│  ├─ RBAC: Users see only their accounts' signals
│  ├─ Audit log: Who viewed/acted on signals
│  └─ GDPR: Data retention policy (signals deleted after 6 months by default)
│
├─ Documentation
│  ├─ Installation guide (admin setup)
│  ├─ User guide (sales rep workflows)
│  ├─ API docs (for future integrations)
│  └─ Troubleshooting guide
│
├─ Onboarding
│  ├─ Interactive setup wizard (channels, accounts, Salesforce)
│  ├─ Sample signals shown in demo mode
│  ├─ Training video: "How to use Momentum" (5 min)
│  └─ In-app tooltips/help
│
├─ QA
│  ├─ Test across channels (public, private, shared)
│  ├─ Test all signal types (create signals manually, verify detection)
│  ├─ Test Salesforce integration (with sandbox)
│  ├─ Test with various confidence levels
│  └─ Stress test: 10k messages/hour → no data loss
│
└─ Launch
   ├─ Internal dog-food: Use Momentum for Convex CRM sales
   ├─ Fix bugs discovered
   ├─ Pick 1-2 beta customers
   ├─ Gather feedback, iterate
   └─ Public launch → announcement, sales outreach
```

---

### Phase 2: Smart Routing & CRM Integration (Weeks 7-12)

**Goal**: Opportunities created automatically, account intelligence working

```
├─ Week 7-8: Advanced Account Mapping
│  ├─ ML entity extraction (spaCy) to auto-find customer names in messages
│  ├─ Fuzzy matching: "acme corp" → "Acme Corporation Inc" (Salesforce)
│  ├─ Learn from manual mappings (improve accuracy over time)
│  └─ Confidence scoring: Only auto-map if >90% certain
│
├─ Week 9-10: Create Opportunities (not just tasks)
│  ├─ Rule: If signal_type = "expansion" AND confidence > 80%
│  │  ├─ Create Salesforce Opportunity (not Task)
│  │  ├─ Name: "Expansion - {Account} - {Signal Description}"
│  │  ├─ Amount: Estimate based on current ARR + assumed expansion %
│  │  ├─ Stage: "Qualification" (sales rep moves forward)
│  │  ├─ Close Date: End of current quarter
│  │  ├─ Description: Signal context + link
│  │  └─ Owner: Account executive (from Account record)
│  │
│  └─ Deduplication: Don't create 3 opportunities for "we need capacity" x3
│     ├─ Check: Is there already an open opp for this account created in last 14 days?
│     ├─ If yes: Link signal to existing opp, add comment
│     └─ If no: Create new opp
│
├─ Week 11: Account Intelligence Dashboard
│  ├─ New page: "/accounts/{account_id}"
│  ├─ Show:
│  │  ├─ Account name, logo, Salesforce link
│  │  ├─ Signal timeline (all signals, last 90 days)
│  │  ├─ Key themes extracted (word cloud of common topics)
│  │  ├─ People involved (chart of who's talking)
│  │  ├─ Activity pulse (graph: # messages/week over time)
│  │  ├─ "If quiet for 30 days: ⚠️ Low engagement"
│  │  ├─ Open opportunities (from Momentum signals)
│  │  ├─ Linked Salesforce records (Account, contacts, opps)
│  │  └─ Rep assigned: Link to their dashboard
│  │
│  └─ Actions: "Create opp", "Assign to different rep", "Schedule call"
│
└─ Week 12: CSM Feedback Loop
   ├─ "Did this signal lead to a deal?" Yes/No/Not sure
   ├─ Input: When opportunity closes/won
   ├─ Feedback stored: signal_id → opportunity_id → deal status
   ├─ Use feedback to improve scoring:
   │  ├─ "Signals from customer contacts are 3x more likely to close"
   │  ├─ "Expansion signals from #support-channel have 40% conversion"
   │  └─ Recalibrate confidence scoring based on real data
   └─ Show CSM: "You helped close $40K from Momentum signals"
```

---

### Phase 3: AI & Intelligence (Weeks 13-18)

**Goal**: Proactive insights, expand to all accounts, higher conversion

```
├─ Weeks 13-14: Improved NLP
│  ├─ Fine-tune transformer model (DistilBERT) on historical sales data
│  ├─ Train on: labeled signals (expansion, risk, etc.) + sales outcomes
│  ├─ Replace keyword matching with model predictions
│  ├─ Output: signal_type confidence, sentiment, intent
│  └─ A/B test: Keyword model vs. ML model → pick winner
│
├─ Weeks 15-16: Churn Risk Scoring
│  ├─ Model inputs:
│  │  ├─ Recent risk signals (negative sentiment, frustration)
│  │  ├─ Activity decline (less Slack activity than baseline)
│  │  ├─ Support escalations (from ticket data)
│  │  ├─ Product usage drop (if integrated)
│  │  ├─ Days until renewal
│  │  └─ Account health score (from Salesforce)
│  │
│  ├─ Output: churn_risk_score (0-100%), churn_probability
│  ├─ Predictions: "TechFlow 78% likely to churn, renewal in 45 days"
│  └─ Trigger: If score > 70% → alert CSM + VP Sales immediately
│
├─ Week 17: Expansion Recommendations
│  ├─ For each account, score expansion likelihood:
│  │  ├─ Recent expansion signals
│  │  ├─ Growth indicators (team size increase, usage growth)
│  │  ├─ Budget signals ("new budget allocated")
│  │  ├─ Champion strength (multiple contacts involved?)
│  │  └─ Historical expansion: "These accounts typically expand in Q3"
│  │
│  └─ Rank opportunities: "Top 10 expansion-ready accounts this quarter"
│
└─ Week 18: Manager Dashboards
   ├─ Sales manager view:
   │  ├─ Team signals: "This week: 15 signals, 3 became opportunities"
   │  ├─ Conversion metrics: "Acme Rep: 30% signal→opp conversion (team avg: 18%)"
   │  ├─ Coaching: "TechFlow has 3 high-intent signals, rep hasn't acted"
   │  ├─ Pipeline impact: "Your team's signals could add $2.3M to pipeline"
   │  └─ Forecasting: "Based on signals, expect 5 expansions this quarter"
   │
   └─ VP Sales view:
      ├─ Company-wide dashboard
      ├─ Team leaderboard: "Best signal responders"
      ├─ Account health matrix: Risk (Y) vs. Opportunity (X)
      └─ Revenue forecast: "Signals indicate $8M+ expansion runway"
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js / TypeScript + Express |
| **Database** | PostgreSQL (signals, rules, mappings) |
| **ML/NLP** | spaCy, Hugging Face transformers |
| **APIs** | Slack API (Events, Messages, OAuth), Salesforce REST API |
| **Frontend** | React (dashboard), TypeScript |
| **Infrastructure** | Docker, AWS (Lambda for async), Redis for caching |
| **Auth** | OAuth (Slack + Salesforce), SSO (SAML) |
| **Monitoring** | Datadog / CloudWatch |
| **Job Queue** | Bull/BullMQ |

---

## Go-to-Market

### Ideal Customer Profile

- **Size**: Mid-market B2B SaaS ($5-50M ARR)
- **Infrastructure**: Heavy Slack usage (>50 people)
- **Tech Stack**: Salesforce or HubSpot with sales team
- **Pain**: Missing upsell opportunities, slow to react to churn
- **Willingness**: Willing to pay for revenue impact

### Pricing Model

- **Starter**: $500/month
  - 1 workspace, 5 Slack channels, Salesforce only

- **Pro**: $1,500/month
  - Unlimited channels, HubSpot + Salesforce, custom rules

- **Enterprise**: Custom
  - Dedicated rules engineer, ML fine-tuning, API access

### Sales Positioning

> "Slack is your customer intelligence layer. Momentum extracts it."

> "Every message your customers send contains signals. We find them, prioritize them, and help you act on them."

> "Recover the 30-40% of expansion revenue you're currently missing."

---

## Key Success Factors

1. **Detection Accuracy** - Better to be quiet than noisy. Start conservative (high confidence threshold), expand as model improves.
2. **Salesforce Sync** - Must be bulletproof. Every signal needs to sync perfectly or reps won't trust the system.
3. **Speed** - Detection and alerts must happen in <5 minutes. Sales decisions move fast.
4. **Adoption** - Make it useful on day 1. If sales reps ignore alerts, you fail.
5. **Feedback Loop** - Every signal that becomes a deal should feed back into the model. This is where magic happens.

---

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| **Slack API rate limits** | Cache aggressively, batch operations, queue system |
| **Salesforce integration fragility** | Use official libraries, comprehensive error handling, monitoring |
| **False positives alienate users** | Start high confidence (>80%), iterate down with feedback data |
| **Privacy/compliance** | Encrypt data, audit logs, GDPR deletion, customer consent |
| **Hard to map accounts** | Provide manual admin UI + fuzzy matching + ask for help |
| **Low signal quality** | Phase 1 keyword-based is basic intentionally, improve in Phase 2 |

---

## Next Steps

Choose one:

1. **Deep dive into any phase** (technical architecture, specific code patterns)
2. **Create wireframes** for dashboard and admin panel
3. **Write detailed go-to-market plan** (positioning, pricing, sales strategy)
4. **Start building Phase 1** (setup project, begin Slack integration)
5. **Create SQL schema** for database

---

*Document created: 2025-12-28*
*Status: Product Specification Complete*
