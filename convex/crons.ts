import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run retention policies daily at 2:00 AM UTC
crons.daily(
  "run-retention-policies",
  { hourUTC: 2, minuteUTC: 0 },
  internal.retentionCron.runAllActiveRetentionPolicies
);

// Expire old data export requests daily at 3:00 AM UTC
crons.daily(
  "expire-data-exports",
  { hourUTC: 3, minuteUTC: 0 },
  internal.retentionCron.expireDataExports
);

// Check for overdue DSR requests daily at 9:00 AM UTC (business hours reminder)
crons.daily(
  "check-overdue-dsrs",
  { hourUTC: 9, minuteUTC: 0 },
  internal.retentionCron.checkOverdueDsrs
);

// Process enrichment queue every 5 minutes
crons.interval(
  "process-enrichment-queue",
  { minutes: 5 },
  internal.parallel.processEnrichmentQueueInternal
);

export default crons;
