import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// DASHBOARD QUERIES
// ============================================================================

/**
 * List all dashboards (public ones and user's own)
 */
export const listDashboards = query({
  args: {},
  handler: async (ctx) => {
    // Get all public dashboards
    const publicDashboards = await ctx.db
      .query("dashboards")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Get user's own dashboards (TODO: filter by actual user when auth is implemented)
    const userDashboards = await ctx.db
      .query("dashboards")
      .collect();

    // Combine and dedupe
    const allDashboards = [...publicDashboards];
    for (const dashboard of userDashboards) {
      if (!allDashboards.find((d) => d._id === dashboard._id)) {
        allDashboards.push(dashboard);
      }
    }

    // Sort by default first, then by name
    allDashboards.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });

    return allDashboards;
  },
});

/**
 * Get a single dashboard by ID with all its widgets
 */
export const getDashboard = query({
  args: { id: v.id("dashboards") },
  handler: async (ctx, args) => {
    const dashboard = await ctx.db.get(args.id);
    if (!dashboard) {
      return null;
    }

    // Get all widgets for this dashboard
    const widgets = await ctx.db
      .query("dashboardWidgets")
      .withIndex("by_dashboard", (q) => q.eq("dashboardId", args.id))
      .collect();

    // Sort widgets by position (y, then x)
    widgets.sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });

    return {
      ...dashboard,
      widgets,
    };
  },
});

/**
 * Get the default dashboard
 */
export const getDefaultDashboard = query({
  args: {},
  handler: async (ctx) => {
    const defaultDashboard = await ctx.db
      .query("dashboards")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first();

    if (!defaultDashboard) {
      return null;
    }

    // Get all widgets for this dashboard
    const widgets = await ctx.db
      .query("dashboardWidgets")
      .withIndex("by_dashboard", (q) => q.eq("dashboardId", defaultDashboard._id))
      .collect();

    // Sort widgets by position (y, then x)
    widgets.sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });

    return {
      ...defaultDashboard,
      widgets,
    };
  },
});

// ============================================================================
// DASHBOARD MUTATIONS
// ============================================================================

/**
 * Create a new dashboard
 */
export const createDashboard = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // If this is set as default, unset any existing default
    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("dashboards")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .first();

      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, { isDefault: false, updatedAt: now });
      }
    }

    const dashboardId = await ctx.db.insert("dashboards", {
      name: args.name,
      description: args.description,
      layout: [],
      isDefault: args.isDefault ?? false,
      isPublic: args.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    });

    return dashboardId;
  },
});

/**
 * Update a dashboard's metadata
 */
export const updateDashboard = mutation({
  args: {
    id: v.id("dashboards"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { id, ...updates } = args;

    // If setting as default, unset any existing default
    if (updates.isDefault) {
      const existingDefault = await ctx.db
        .query("dashboards")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .first();

      if (existingDefault && existingDefault._id !== id) {
        await ctx.db.patch(existingDefault._id, { isDefault: false, updatedAt: now });
      }
    }

    // Build update object, removing undefined values
    const updateObj: Record<string, unknown> = { updatedAt: now };
    if (updates.name !== undefined) updateObj.name = updates.name;
    if (updates.description !== undefined) updateObj.description = updates.description;
    if (updates.isDefault !== undefined) updateObj.isDefault = updates.isDefault;
    if (updates.isPublic !== undefined) updateObj.isPublic = updates.isPublic;

    await ctx.db.patch(id, updateObj);
    return id;
  },
});

/**
 * Delete a dashboard and all its widgets
 */
export const deleteDashboard = mutation({
  args: { id: v.id("dashboards") },
  handler: async (ctx, args) => {
    // Delete all widgets first
    const widgets = await ctx.db
      .query("dashboardWidgets")
      .withIndex("by_dashboard", (q) => q.eq("dashboardId", args.id))
      .collect();

    for (const widget of widgets) {
      await ctx.db.delete(widget._id);
    }

    // Delete the dashboard
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Duplicate a dashboard with all its widgets
 */
export const duplicateDashboard = mutation({
  args: {
    id: v.id("dashboards"),
    newName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get the original dashboard
    const original = await ctx.db.get(args.id);
    if (!original) {
      throw new Error("Dashboard not found");
    }

    // Get original widgets
    const originalWidgets = await ctx.db
      .query("dashboardWidgets")
      .withIndex("by_dashboard", (q) => q.eq("dashboardId", args.id))
      .collect();

    // Create new dashboard
    const newDashboardId = await ctx.db.insert("dashboards", {
      name: args.newName ?? `${original.name} (Copy)`,
      description: original.description,
      layout: [], // Will be updated after creating widgets
      isDefault: false, // Copy should never be default
      isPublic: false, // Copy should be private initially
      createdAt: now,
      updatedAt: now,
    });

    // Create new widgets and build layout mapping
    const widgetIdMap: Record<string, string> = {};
    for (const widget of originalWidgets) {
      const newWidgetId = await ctx.db.insert("dashboardWidgets", {
        dashboardId: newDashboardId,
        type: widget.type,
        title: widget.title,
        config: widget.config,
        position: widget.position,
        createdAt: now,
        updatedAt: now,
      });
      widgetIdMap[widget._id] = newWidgetId;
    }

    // Update layout with new widget IDs
    const newLayout = (original.layout || []).map((item: any) => ({
      ...item,
      widgetId: widgetIdMap[item.widgetId] ?? item.widgetId,
    }));

    await ctx.db.patch(newDashboardId, { layout: newLayout });

    return newDashboardId;
  },
});

/**
 * Update the layout (widget positions) of a dashboard
 */
export const updateLayout = mutation({
  args: {
    dashboardId: v.id("dashboards"),
    layout: v.array(
      v.object({
        widgetId: v.string(),
        x: v.number(),
        y: v.number(),
        w: v.number(),
        h: v.number(),
        minW: v.optional(v.number()),
        minH: v.optional(v.number()),
        maxW: v.optional(v.number()),
        maxH: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.dashboardId, {
      layout: args.layout,
      updatedAt: Date.now(),
    });
    return args.dashboardId;
  },
});

// ============================================================================
// WIDGET MUTATIONS
// ============================================================================

/**
 * Add a widget to a dashboard
 */
export const addWidget = mutation({
  args: {
    dashboardId: v.id("dashboards"),
    type: v.union(
      v.literal("metric"),
      v.literal("chart"),
      v.literal("list"),
      v.literal("table"),
      v.literal("funnel"),
      v.literal("leaderboard")
    ),
    title: v.string(),
    config: v.object({
      dataSource: v.optional(v.string()),
      metricType: v.optional(v.string()),
      metricField: v.optional(v.string()),
      chartType: v.optional(v.string()),
      xAxis: v.optional(v.string()),
      yAxis: v.optional(v.string()),
      groupBy: v.optional(v.string()),
      columns: v.optional(v.array(v.string())),
      sortBy: v.optional(v.string()),
      sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
      limit: v.optional(v.number()),
      pipelineId: v.optional(v.string()),
      leaderboardType: v.optional(v.string()),
      filters: v.optional(v.any()),
      dateRange: v.optional(v.string()),
      customDateStart: v.optional(v.number()),
      customDateEnd: v.optional(v.number()),
      showComparison: v.optional(v.boolean()),
      comparisonPeriod: v.optional(v.string()),
      color: v.optional(v.string()),
      icon: v.optional(v.string()),
    }),
    position: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
        w: v.number(),
        h: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Calculate position based on existing widgets or use provided position
    const defaultSize = getDefaultWidgetSize(args.type);

    // Get dashboard to check layout
    const dashboard = await ctx.db.get(args.dashboardId);
    if (!dashboard) {
      throw new Error("Dashboard not found");
    }

    const position = args.position ?? findNextPosition(dashboard.layout || [], defaultSize);

    // Create the widget
    const widgetId = await ctx.db.insert("dashboardWidgets", {
      dashboardId: args.dashboardId,
      type: args.type,
      title: args.title,
      config: args.config,
      position: {
        x: position.x,
        y: position.y,
        width: position.w ?? defaultSize.w,
        height: position.h ?? defaultSize.h,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Update layout
    const newLayout = [
      ...(dashboard.layout || []),
      {
        widgetId,
        x: position.x,
        y: position.y,
        w: position.w ?? defaultSize.w,
        h: position.h ?? defaultSize.h,
        minW: defaultSize.minW,
        minH: defaultSize.minH,
      },
    ];

    await ctx.db.patch(args.dashboardId, { layout: newLayout, updatedAt: now });

    return widgetId;
  },
});

/**
 * Update a widget's configuration
 */
export const updateWidget = mutation({
  args: {
    widgetId: v.id("dashboardWidgets"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    refreshInterval: v.optional(v.number()),
    config: v.optional(
      v.object({
        dataSource: v.optional(v.string()),
        metricType: v.optional(v.string()),
        metricField: v.optional(v.string()),
        chartType: v.optional(v.string()),
        xAxis: v.optional(v.string()),
        yAxis: v.optional(v.string()),
        groupBy: v.optional(v.string()),
        columns: v.optional(v.array(v.string())),
        sortBy: v.optional(v.string()),
        sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
        limit: v.optional(v.number()),
        pipelineId: v.optional(v.string()),
        leaderboardType: v.optional(v.string()),
        filters: v.optional(v.any()),
        dateRange: v.optional(v.string()),
        customDateStart: v.optional(v.number()),
        customDateEnd: v.optional(v.number()),
        showComparison: v.optional(v.boolean()),
        comparisonPeriod: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
      })
    ),
    position: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { widgetId, ...updates } = args;
    const now = Date.now();

    // Build update object
    const updateObj: Record<string, unknown> = { updatedAt: now };
    if (updates.title !== undefined) updateObj.title = updates.title;
    if (updates.description !== undefined) updateObj.description = updates.description;
    if (updates.refreshInterval !== undefined) updateObj.refreshInterval = updates.refreshInterval;
    if (updates.config !== undefined) updateObj.config = updates.config;
    if (updates.position !== undefined) updateObj.position = updates.position;

    await ctx.db.patch(widgetId, updateObj);
    return widgetId;
  },
});

/**
 * Remove a widget from a dashboard
 */
export const removeWidget = mutation({
  args: { widgetId: v.id("dashboardWidgets") },
  handler: async (ctx, args) => {
    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    // Remove from dashboard layout
    const dashboard = await ctx.db.get(widget.dashboardId);
    if (dashboard) {
      const newLayout = (dashboard.layout || []).filter((item: any) => item.widgetId !== args.widgetId);
      await ctx.db.patch(dashboard._id, { layout: newLayout, updatedAt: Date.now() });
    }

    // Delete the widget
    await ctx.db.delete(args.widgetId);
    return args.widgetId;
  },
});

// ============================================================================
// WIDGET DATA QUERIES
// ============================================================================

/**
 * Get data for a widget based on its configuration
 */
export const getWidgetData = query({
  args: { widgetId: v.id("dashboardWidgets") },
  handler: async (ctx, args) => {
    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      return null;
    }

    const { type, config } = widget;

    // Calculate date range
    const dateRange = getDateRange(config.dateRange, config.customDateStart, config.customDateEnd);

    switch (type) {
      case "metric":
        return await getMetricData(ctx, config, dateRange);
      case "chart":
        return await getChartData(ctx, config, dateRange);
      case "list":
        return await getListData(ctx, config, dateRange);
      case "table":
        return await getTableData(ctx, config, dateRange);
      case "funnel":
        return await getFunnelData(ctx, config);
      case "leaderboard":
        return await getLeaderboardData(ctx, config, dateRange);
      default:
        return null;
    }
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDefaultWidgetSize(type: string): { w: number; h: number; minW: number; minH: number } {
  switch (type) {
    case "metric":
      return { w: 3, h: 2, minW: 2, minH: 2 };
    case "chart":
      return { w: 6, h: 4, minW: 4, minH: 3 };
    case "list":
      return { w: 4, h: 4, minW: 3, minH: 3 };
    case "table":
      return { w: 6, h: 4, minW: 4, minH: 3 };
    case "funnel":
      return { w: 6, h: 4, minW: 4, minH: 3 };
    case "leaderboard":
      return { w: 4, h: 4, minW: 3, minH: 3 };
    default:
      return { w: 4, h: 3, minW: 2, minH: 2 };
  }
}

function findNextPosition(
  layout: Array<{ x: number; y: number; w: number; h: number }>,
  size: { w: number; h: number }
): { x: number; y: number; w: number; h: number } {
  const COLS = 12;

  if (layout.length === 0) {
    return { x: 0, y: 0, ...size };
  }

  // Find the maximum y value and try to place after
  let maxY = 0;
  for (const item of layout) {
    const bottom = item.y + item.h;
    if (bottom > maxY) {
      maxY = bottom;
    }
  }

  // Try to find a gap in the existing row first
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= COLS - size.w; x++) {
      const fits = !layout.some(
        (item) =>
          x < item.x + item.w &&
          x + size.w > item.x &&
          y < item.y + item.h &&
          y + size.h > item.y
      );
      if (fits) {
        return { x, y, ...size };
      }
    }
  }

  // Place at the bottom
  return { x: 0, y: maxY, ...size };
}

function getDateRange(
  range?: string,
  customStart?: number,
  customEnd?: number
): { start: number; end: number } {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  switch (range) {
    case "today":
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return { start: todayStart.getTime(), end: now };
    case "week":
      return { start: now - 7 * day, end: now };
    case "month":
      return { start: now - 30 * day, end: now };
    case "quarter":
      return { start: now - 90 * day, end: now };
    case "year":
      return { start: now - 365 * day, end: now };
    case "custom":
      return { start: customStart ?? now - 30 * day, end: customEnd ?? now };
    case "all":
    default:
      return { start: 0, end: now };
  }
}

async function getMetricData(
  ctx: { db: any },
  config: any,
  dateRange: { start: number; end: number }
) {
  const { dataSource, metricType, metricField, showComparison, comparisonPeriod } = config;

  let items: any[] = [];

  // Get data based on source
  switch (dataSource) {
    case "deals":
      items = await ctx.db.query("deals").collect();
      break;
    case "contacts":
      items = await ctx.db.query("contacts").collect();
      break;
    case "companies":
      items = await ctx.db.query("companies").collect();
      break;
    case "activities":
      items = await ctx.db.query("activities").collect();
      break;
    default:
      items = [];
  }

  // Filter by date range
  items = items.filter(
    (item) => item.createdAt >= dateRange.start && item.createdAt <= dateRange.end
  );

  // Calculate metric
  let value = 0;
  switch (metricType) {
    case "count":
      value = items.length;
      break;
    case "sum":
      value = items.reduce((sum, item) => sum + (item[metricField] || 0), 0);
      break;
    case "average":
      value = items.length > 0
        ? items.reduce((sum, item) => sum + (item[metricField] || 0), 0) / items.length
        : 0;
      break;
    default:
      value = items.length;
  }

  // Calculate comparison if enabled
  let change: number | undefined;
  if (showComparison) {
    const periodLength = dateRange.end - dateRange.start;
    const previousRange = {
      start: dateRange.start - periodLength,
      end: dateRange.start,
    };

    let previousItems: any[] = [];
    switch (dataSource) {
      case "deals":
        previousItems = await ctx.db.query("deals").collect();
        break;
      case "contacts":
        previousItems = await ctx.db.query("contacts").collect();
        break;
      case "companies":
        previousItems = await ctx.db.query("companies").collect();
        break;
      case "activities":
        previousItems = await ctx.db.query("activities").collect();
        break;
    }

    previousItems = previousItems.filter(
      (item) => item.createdAt >= previousRange.start && item.createdAt <= previousRange.end
    );

    let previousValue = 0;
    switch (metricType) {
      case "count":
        previousValue = previousItems.length;
        break;
      case "sum":
        previousValue = previousItems.reduce((sum, item) => sum + (item[metricField] || 0), 0);
        break;
      case "average":
        previousValue = previousItems.length > 0
          ? previousItems.reduce((sum, item) => sum + (item[metricField] || 0), 0) / previousItems.length
          : 0;
        break;
    }

    change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
  }

  return { value, change };
}

async function getChartData(
  ctx: { db: any },
  config: any,
  dateRange: { start: number; end: number }
) {
  const { dataSource, chartType, groupBy } = config;

  let items: any[] = [];

  switch (dataSource) {
    case "deals":
      items = await ctx.db.query("deals").collect();
      break;
    case "contacts":
      items = await ctx.db.query("contacts").collect();
      break;
    case "companies":
      items = await ctx.db.query("companies").collect();
      break;
    case "activities":
      items = await ctx.db.query("activities").collect();
      break;
    default:
      items = [];
  }

  // Filter by date range
  items = items.filter(
    (item) => item.createdAt >= dateRange.start && item.createdAt <= dateRange.end
  );

  // Group data
  const grouped = new Map<string, number>();
  for (const item of items) {
    const key = groupBy ? String(item[groupBy] ?? "Unknown") : "Total";
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
}

async function getListData(
  ctx: { db: any },
  config: any,
  dateRange: { start: number; end: number }
) {
  const { dataSource, sortBy, sortOrder, limit = 10 } = config;

  let items: any[] = [];

  switch (dataSource) {
    case "deals":
      items = await ctx.db.query("deals").order(sortOrder === "asc" ? "asc" : "desc").take(limit);
      break;
    case "contacts":
      items = await ctx.db.query("contacts").order(sortOrder === "asc" ? "asc" : "desc").take(limit);
      break;
    case "companies":
      items = await ctx.db.query("companies").order(sortOrder === "asc" ? "asc" : "desc").take(limit);
      break;
    case "activities":
      items = await ctx.db.query("activities").order(sortOrder === "asc" ? "asc" : "desc").take(limit);
      break;
    default:
      items = [];
  }

  return items;
}

async function getTableData(
  ctx: { db: any },
  config: any,
  dateRange: { start: number; end: number }
) {
  const { dataSource, columns, sortBy, sortOrder, limit = 25 } = config;

  let items: any[] = [];

  switch (dataSource) {
    case "deals":
      items = await ctx.db.query("deals").order(sortOrder === "asc" ? "asc" : "desc").take(limit);
      break;
    case "contacts":
      items = await ctx.db.query("contacts").order(sortOrder === "asc" ? "asc" : "desc").take(limit);
      break;
    case "companies":
      items = await ctx.db.query("companies").order(sortOrder === "asc" ? "asc" : "desc").take(limit);
      break;
    case "activities":
      items = await ctx.db.query("activities").order(sortOrder === "asc" ? "asc" : "desc").take(limit);
      break;
    default:
      items = [];
  }

  // Filter to only include specified columns
  if (columns && columns.length > 0) {
    items = items.map((item) => {
      const filtered: Record<string, unknown> = { _id: item._id };
      for (const col of columns) {
        filtered[col] = item[col];
      }
      return filtered;
    });
  }

  return items;
}

async function getFunnelData(ctx: { db: any }, config: any) {
  const { pipelineId } = config;

  // Get the pipeline
  let pipeline;
  if (pipelineId) {
    pipeline = await ctx.db.get(pipelineId as Id<"pipelines">);
  } else {
    // Get default pipeline
    pipeline = await ctx.db
      .query("pipelines")
      .withIndex("by_default", (q: any) => q.eq("isDefault", true))
      .first();
  }

  if (!pipeline) {
    return { stages: [] };
  }

  // Get all open deals for this pipeline
  const deals = await ctx.db
    .query("deals")
    .withIndex("by_pipeline_stage", (q: any) => q.eq("pipelineId", pipeline._id))
    .filter((q: any) => q.eq(q.field("status"), "open"))
    .collect();

  // Count deals per stage
  const stageData = pipeline.stages.map((stage: any) => {
    const stageDeals = deals.filter((d: any) => d.stageId === stage.id);
    return {
      name: stage.name,
      value: stageDeals.length,
      amount: stageDeals.reduce((sum: number, d: any) => sum + (d.amount || 0), 0),
      color: stage.color,
    };
  });

  return { stages: stageData };
}

async function getLeaderboardData(
  ctx: { db: any },
  config: any,
  dateRange: { start: number; end: number }
) {
  const { leaderboardType, limit = 10 } = config;

  // Get all users
  const users = await ctx.db.query("users").collect();

  let leaderboard: Array<{ userId: string; name: string; value: number; avatarUrl?: string }> = [];

  switch (leaderboardType) {
    case "deals_won": {
      const deals = await ctx.db
        .query("deals")
        .filter((q: any) => q.eq(q.field("status"), "won"))
        .collect();

      const filteredDeals = deals.filter(
        (d: any) => d.actualCloseDate && d.actualCloseDate >= dateRange.start && d.actualCloseDate <= dateRange.end
      );

      // Count by owner
      const counts = new Map<string, number>();
      for (const deal of filteredDeals) {
        if (deal.ownerId) {
          counts.set(deal.ownerId, (counts.get(deal.ownerId) || 0) + 1);
        }
      }

      leaderboard = users
        .filter((u: any) => counts.has(u._id))
        .map((u: any) => ({
          userId: u._id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          value: counts.get(u._id) || 0,
          avatarUrl: u.avatarUrl,
        }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, limit);
      break;
    }

    case "deals_value": {
      const deals = await ctx.db
        .query("deals")
        .filter((q: any) => q.eq(q.field("status"), "won"))
        .collect();

      const filteredDeals = deals.filter(
        (d: any) => d.actualCloseDate && d.actualCloseDate >= dateRange.start && d.actualCloseDate <= dateRange.end
      );

      // Sum by owner
      const sums = new Map<string, number>();
      for (const deal of filteredDeals) {
        if (deal.ownerId) {
          sums.set(deal.ownerId, (sums.get(deal.ownerId) || 0) + (deal.amount || 0));
        }
      }

      leaderboard = users
        .filter((u: any) => sums.has(u._id))
        .map((u: any) => ({
          userId: u._id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          value: sums.get(u._id) || 0,
          avatarUrl: u.avatarUrl,
        }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, limit);
      break;
    }

    case "activities": {
      const activities = await ctx.db.query("activities").collect();

      const filteredActivities = activities.filter(
        (a: any) => a.createdAt >= dateRange.start && a.createdAt <= dateRange.end
      );

      // Count by owner
      const counts = new Map<string, number>();
      for (const activity of filteredActivities) {
        if (activity.ownerId) {
          counts.set(activity.ownerId, (counts.get(activity.ownerId) || 0) + 1);
        }
      }

      leaderboard = users
        .filter((u: any) => counts.has(u._id))
        .map((u: any) => ({
          userId: u._id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          value: counts.get(u._id) || 0,
          avatarUrl: u.avatarUrl,
        }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, limit);
      break;
    }

    case "contacts_added": {
      const contacts = await ctx.db.query("contacts").collect();

      const filteredContacts = contacts.filter(
        (c: any) => c.createdAt >= dateRange.start && c.createdAt <= dateRange.end
      );

      // Count by owner
      const counts = new Map<string, number>();
      for (const contact of filteredContacts) {
        if (contact.ownerId) {
          counts.set(contact.ownerId, (counts.get(contact.ownerId) || 0) + 1);
        }
      }

      leaderboard = users
        .filter((u: any) => counts.has(u._id))
        .map((u: any) => ({
          userId: u._id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          value: counts.get(u._id) || 0,
          avatarUrl: u.avatarUrl,
        }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, limit);
      break;
    }
  }

  return { entries: leaderboard };
}
