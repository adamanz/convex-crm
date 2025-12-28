import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get comprehensive dashboard statistics
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Get contacts count
    const contacts = await ctx.db.query("contacts").collect();
    const totalContacts = contacts.length;

    // Calculate contacts change (contacts created in last 30 days vs previous 30 days)
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const contactsLast30Days = contacts.filter(
      (c) => c.createdAt >= thirtyDaysAgo
    ).length;
    const contactsPrevious30Days = contacts.filter(
      (c) => c.createdAt >= sixtyDaysAgo && c.createdAt < thirtyDaysAgo
    ).length;

    const contactsChange =
      contactsPrevious30Days > 0
        ? ((contactsLast30Days - contactsPrevious30Days) /
            contactsPrevious30Days) *
          100
        : contactsLast30Days > 0
          ? 100
          : 0;

    // Get deals stats
    const deals = await ctx.db.query("deals").collect();
    const openDeals = deals.filter((d) => d.status === "open");
    const totalOpenDeals = openDeals.length;

    // Calculate pipeline value
    const pipelineValue = openDeals.reduce(
      (sum, deal) => sum + (deal.amount || 0),
      0
    );

    // Calculate weighted pipeline value
    const weightedPipelineValue = openDeals.reduce(
      (sum, deal) =>
        sum + (deal.amount || 0) * ((deal.probability || 50) / 100),
      0
    );

    // Calculate deals change
    const dealsLast30Days = deals.filter(
      (d) => d.createdAt >= thirtyDaysAgo
    ).length;
    const dealsPrevious30Days = deals.filter(
      (d) => d.createdAt >= sixtyDaysAgo && d.createdAt < thirtyDaysAgo
    ).length;

    const dealsChange =
      dealsPrevious30Days > 0
        ? ((dealsLast30Days - dealsPrevious30Days) / dealsPrevious30Days) * 100
        : dealsLast30Days > 0
          ? 100
          : 0;

    // Calculate pipeline value change
    const dealsClosedLast30Days = deals.filter(
      (d) => d.status === "won" && d.actualCloseDate && d.actualCloseDate >= thirtyDaysAgo
    );
    const wonValueLast30Days = dealsClosedLast30Days.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );

    const dealsClosedPrevious30Days = deals.filter(
      (d) =>
        d.status === "won" &&
        d.actualCloseDate &&
        d.actualCloseDate >= sixtyDaysAgo &&
        d.actualCloseDate < thirtyDaysAgo
    );
    const wonValuePrevious30Days = dealsClosedPrevious30Days.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );

    const pipelineChange =
      wonValuePrevious30Days > 0
        ? ((wonValueLast30Days - wonValuePrevious30Days) /
            wonValuePrevious30Days) *
          100
        : wonValueLast30Days > 0
          ? 100
          : 0;

    // Get tasks due soon (next 7 days)
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_type")
      .filter((q) => q.eq(q.field("type"), "task"))
      .collect();

    const tasksUpcoming = activities.filter(
      (a) =>
        a.type === "task" &&
        !a.completed &&
        a.dueDate &&
        a.dueDate <= sevenDaysFromNow
    );
    const tasksDue = tasksUpcoming.length;

    // Calculate overdue tasks
    const overdueTasks = activities.filter(
      (a) =>
        a.type === "task" && !a.completed && a.dueDate && a.dueDate < now
    ).length;

    return {
      totalContacts,
      contactsChange,
      totalOpenDeals,
      dealsChange,
      pipelineValue,
      weightedPipelineValue,
      pipelineChange,
      tasksDue,
      overdueTasks,
    };
  },
});

/**
 * Get recent activity for the dashboard feed
 */
export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    // Get recent activity log entries
    const activityLog = await ctx.db
      .query("activityLog")
      .withIndex("by_timestamp")
      .order("desc")
      .take(20);

    // Enrich with entity details
    const enrichedActivities = await Promise.all(
      activityLog.map(async (log) => {
        let entityName = "";
        let entityLink = "";

        if (log.entityType === "contact") {
          const contact = await ctx.db.get(log.entityId as Id<"contacts">);
          if (contact) {
            entityName = `${contact.firstName || ""} ${contact.lastName}`.trim();
            entityLink = `/contacts/${log.entityId}`;
          }
        } else if (log.entityType === "company") {
          const company = await ctx.db.get(log.entityId as Id<"companies">);
          if (company) {
            entityName = company.name;
            entityLink = `/companies/${log.entityId}`;
          }
        } else if (log.entityType === "deal") {
          const deal = await ctx.db.get(log.entityId as Id<"deals">);
          if (deal) {
            entityName = deal.name;
            entityLink = `/deals/${log.entityId}`;
          }
        }

        let activityType:
          | "contact_created"
          | "deal_created"
          | "deal_won"
          | "deal_lost"
          | "task_completed"
          | "note_added"
          | "email_sent"
          | "call_logged"
          | "meeting_scheduled" = "note_added";

        // Map action to activity type
        if (log.action === "contact_created" || log.action === "created" && log.entityType === "contact") {
          activityType = "contact_created";
        } else if (log.action === "created" && log.entityType === "deal") {
          activityType = "deal_created";
        } else if (log.action === "won") {
          activityType = "deal_won";
        } else if (log.action === "lost") {
          activityType = "deal_lost";
        } else if (log.action === "completed") {
          activityType = "task_completed";
        }

        // Build description
        let description = "";
        switch (log.action) {
          case "contact_created":
          case "created":
            description = `New ${log.entityType} created: ${entityName}`;
            break;
          case "contact_updated":
          case "updated":
            description = `${log.entityType} updated: ${entityName}`;
            break;
          case "stage_changed":
            description = `Deal stage changed: ${entityName}`;
            break;
          case "won":
            description = `Deal won: ${entityName}`;
            break;
          case "lost":
            description = `Deal lost: ${entityName}`;
            break;
          case "reopened":
            description = `Deal reopened: ${entityName}`;
            break;
          default:
            description = `${log.action}: ${entityName}`;
        }

        return {
          id: log._id,
          type: activityType,
          description,
          timestamp: log.timestamp,
          link: entityLink || undefined,
          metadata: {
            entityType: log.entityType,
            entityId: log.entityId,
            action: log.action,
          },
        };
      })
    );

    return enrichedActivities.filter((a) => a.description);
  },
});

/**
 * Get upcoming tasks for the dashboard
 */
export const getUpcomingTasks = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    // Get all incomplete tasks with due dates
    const tasks = await ctx.db
      .query("activities")
      .withIndex("by_due_date")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "task"),
          q.neq(q.field("completed"), true)
        )
      )
      .order("asc")
      .take(50);

    // Filter and enrich tasks
    const upcomingTasks = await Promise.all(
      tasks
        .filter((t) => t.dueDate && t.dueDate <= sevenDaysFromNow)
        .slice(0, 10)
        .map(async (task) => {
          let relatedEntity = null;
          let relatedEntityName = "";
          let relatedEntityLink = "";

          if (task.relatedToType === "contact") {
            relatedEntity = await ctx.db.get(
              task.relatedToId as Id<"contacts">
            );
            if (relatedEntity) {
              relatedEntityName =
                `${relatedEntity.firstName || ""} ${relatedEntity.lastName}`.trim();
              relatedEntityLink = `/contacts/${task.relatedToId}`;
            }
          } else if (task.relatedToType === "company") {
            relatedEntity = await ctx.db.get(
              task.relatedToId as Id<"companies">
            );
            if (relatedEntity) {
              relatedEntityName = relatedEntity.name;
              relatedEntityLink = `/companies/${task.relatedToId}`;
            }
          } else if (task.relatedToType === "deal") {
            relatedEntity = await ctx.db.get(task.relatedToId as Id<"deals">);
            if (relatedEntity) {
              relatedEntityName = relatedEntity.name;
              relatedEntityLink = `/deals/${task.relatedToId}`;
            }
          }

          const isOverdue = task.dueDate! < now;
          const isDueToday =
            task.dueDate! >= now &&
            task.dueDate! < now + 24 * 60 * 60 * 1000;

          return {
            id: task._id,
            subject: task.subject,
            description: task.description,
            dueDate: task.dueDate!,
            priority: task.priority || "medium",
            isOverdue,
            isDueToday,
            relatedTo: {
              type: task.relatedToType,
              id: task.relatedToId,
              name: relatedEntityName,
              link: relatedEntityLink,
            },
          };
        })
    );

    return upcomingTasks;
  },
});

/**
 * Get pipeline stage distribution for mini-chart
 */
export const getPipelineDistribution = query({
  args: {},
  handler: async (ctx) => {
    // Get the default pipeline
    const defaultPipeline = await ctx.db
      .query("pipelines")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first();

    if (!defaultPipeline) {
      return {
        pipeline: null,
        stages: [],
      };
    }

    // Get open deals for this pipeline
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_pipeline_stage", (q) =>
        q.eq("pipelineId", defaultPipeline._id)
      )
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();

    // Count deals per stage
    const stageData = defaultPipeline.stages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stageId === stage.id);
      const count = stageDeals.length;
      const value = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

      return {
        id: stage.id,
        name: stage.name,
        color: stage.color,
        order: stage.order,
        count,
        value,
      };
    });

    // Sort by order
    stageData.sort((a, b) => a.order - b.order);

    return {
      pipeline: {
        id: defaultPipeline._id,
        name: defaultPipeline.name,
      },
      stages: stageData,
    };
  },
});
