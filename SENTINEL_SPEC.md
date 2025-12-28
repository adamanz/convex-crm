# SENTINEL: Development Plan
**Slack-to-CRM signal sentinel that detects intent, risk, and opportunities in customer conversations**

---

## Objectives
- Ship an end-to-end MVP that ingests Slack, detects high-value signals, and syncs them into the CRM with a usable dashboard.
- Prove accuracy and trustworthiness (high precision, low false positives) while keeping delivery speed under five minutes.
- Provide a configurable rules layer and admin controls so go-to-market teams can tune what gets surfaced.
- Lay a runway for ML-driven scoring without blocking the MVP on heavy modeling.

## Scope (v1)
- **In scope:** Slack ingestion (public/private channels with consent), basic keyword/semantic detection, sentiment, deduplication, manual account mapping, Salesforce task sync, signal feed UI, daily digests, simple admin config.
- **Out of scope for v1:** Multi-workspace federation, HubSpot/other CRMs, email ingestion, fine-tuned models, mobile app, advanced RBAC beyond roles.

## Guiding Principles
- Optimize for trust: prefer precision over recall for launch.
- Keep every step observable (logs, metrics, audit trails) to debug signal quality.
- Small, vertical slices: ship ingestion → detection → sync → UI in narrow increments.
- Explicit exits per phase; no phase closes without tests and monitoring in place.

## Phased Timeline (6-7 weeks)

### Phase 0 – Foundations (Week 1)
- Stand up environments and secrets management for Slack and Salesforce.
- Define Convex data model v1: workspaces, channels, users, customers/accounts, signals, rules, sync jobs, notifications.
- Telemetry baseline: structured logging, request tracing, error alerting, health checks.
- Feature flags for detection rules and CRM sync.

### Phase 1 – Slack Ingestion & Account Mapping (Week 2)
- Create Slack app (events: `message.channels`, `message.im`; scopes: channels:read, chat:write, users:read, reactions:read).
- Event pipeline: verify signatures, enqueue messages, persist raw payload + minimal normalized shape.
- Channel onboarding flow: list channels, allow admins to pick monitored channels, store workspace metadata.
- Manual account mapping: channel → customer/account; fallback tagging flow for unmapped messages.
- Tests: signature verification, rate-limit handling, storage happy path + DLQ for failures.

### Phase 2 – Signal Detection & Scoring (Week 3)
- Keyword/phrase dictionaries for expansion, risk, intent, usage, churn; sentiment heuristics.
- Scoring model: base keyword hits + channel/sender boosts + sentiment modifiers; confidence thresholds by signal type.
- Context capture: window of ±N messages; store participants and timestamps.
- Deduplication: same signal type in a channel within 24h collapses; link child signals.
- Tests: scoring unit tests per signal type, dedupe behavior, context capture.

### Phase 3 – CRM Sync (Week 4)
- Salesforce OAuth + token storage; minimal org metadata fetch.
- Mapping: Slack customer/channel → Salesforce Account; optional Contact resolution by email/name.
- Actions: create Task for confidence > threshold; attach raw message link/context; idempotency via sentinel_signal_id.
- Error handling: retries with backoff, DLQ/rehydration path, admin surface for failed syncs.
- Tests: integration happy path (mocked Salesforce), idempotency, failure retries.

### Phase 4 – Surfaces: Feed, Alerts, and Digest (Week 5)
- Signal feed UI (Next.js): filters by account, signal type, confidence, timeframe; link to Slack thread.
- Action buttons: mark handled, create follow-up, snooze; activity log per signal.
- Notifications: Slack DM daily digest + optional immediate alerts for high risk/expansion.
- Tests: component tests for filters and actions; E2E flow from injected Slack message → visible feed card.

### Phase 5 – Admin & Rules (Week 6)
- Admin console: channel/customer mapping table; re-run sync for failed signals.
- Editable rules: per-signal keyword lists, thresholds, channel/sender boosts; preview scoring on sample text.
- User prefs: notification cadence and surface (DM vs email digest).
- Tests: rules parsing/validation; admin actions audit logged.

### Phase 6 – Hardening & Launch (Week 7)
- Performance: queue sizing, concurrency caps, benchmarks at target throughput (1k msgs/min/workspace).
- Security/compliance: token encryption, RBAC (admin, rep, manager), audit trail, data retention toggles.
- Monitoring: dashboards for detection volume, false-positive triage, CRM sync success rates, P99 latency.
- Beta rollout: 1-2 design partners, feedback loop, bug bash; go/no-go checklist for GA.

## Deliverables by Milestone
- **MVP Exit (end Week 4):** Slack ingestion, signal scoring, Salesforce task sync, minimal feed, daily digest; >90% task creation success on test data.
- **Adminizable Release (end Week 6):** Rules editor, retries console, user notification prefs, mapped channels coverage >80% for pilot workspace.
- **GA Candidate (end Week 7):** SLOs defined and met, observability dashboards live, security checklist passed, beta feedback addressed.

## Risks & Mitigations
- **False positives erode trust:** Start with conservative thresholds; require manual confirm for low-confidence signals; track per-rule precision.
- **Sync fragility with Salesforce:** Idempotent writes, DLQ + replay, sandbox-first testing, alerting on >5% failures.
- **Account mapping gaps:** Mandatory mapping gate for monitored channels, quick-tag fallback, fuzzy suggestions in Phase 2.5 if time.
- **Slack rate limits:** Queue + backoff, batch channel metadata pulls, cache users/channels.

## Open Questions
- Target CRM priority after Salesforce: HubSpot or keep focused until GA?
- Do we need shared-channel support at launch or can it wait for post-GA?
- What is the required data retention window for customer messages (default 6 months?) and deletion workflows?

## Appendix: Data Model v1 (Convex)
- `workspaces`: slack_team_id, domain, auth tokens (encrypted), created_at.
- `channels`: channel_id, workspace_id, name, is_monitored, customer_id?, created_at.
- `customers`: customer_id, workspace_id, display_name, salesforce_account_id?, created_at.
- `signals`: signal_id, workspace_id, channel_id, customer_id?, type, confidence, sentiment, message_ts, author_id, context, parent_signal_id?, status, created_at.
- `rules`: rule_id, workspace_id, signal_type, keywords, boosts, threshold, created_at, updated_at.
- `sync_jobs`: job_id, signal_id, target (salesforce), status, attempts, error?, created_at, updated_at.
- `notifications`: notification_id, workspace_id, user_id, type (immediate/digest), signal_id?, sent_at.
