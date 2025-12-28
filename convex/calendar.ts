import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";

// =============================================================================
// TYPES
// =============================================================================

type CalendarProvider = "google" | "outlook" | "apple";
type SyncDirection = "one-way" | "two-way";
type ConnectionStatus = "connected" | "disconnected" | "error" | "token_expired";
type EventStatus = "confirmed" | "tentative" | "cancelled";

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    organizer?: boolean;
  }>;
  recurringEventId?: string;
  recurrence?: string[];
  iCalUID?: string;
  etag?: string;
  updated?: string;
  colorId?: string;
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all calendar connections for the current user
 */
export const getConnections = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Don't expose sensitive tokens
    return connections.map((conn) => ({
      id: conn._id,
      provider: conn.provider,
      email: conn.email,
      name: conn.name,
      status: conn.status,
      syncDirection: conn.syncDirection,
      syncEnabled: conn.syncEnabled,
      lastSyncedAt: conn.lastSyncedAt,
      errorMessage: conn.errorMessage,
      createdAt: conn.createdAt,
    }));
  },
});

/**
 * Get a single calendar connection by ID
 */
export const getConnection = query({
  args: {
    connectionId: v.id("calendarConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) return null;

    // Don't expose sensitive tokens
    return {
      id: connection._id,
      provider: connection.provider,
      email: connection.email,
      name: connection.name,
      status: connection.status,
      syncDirection: connection.syncDirection,
      syncEnabled: connection.syncEnabled,
      lastSyncedAt: connection.lastSyncedAt,
      errorMessage: connection.errorMessage,
      createdAt: connection.createdAt,
    };
  },
});

/**
 * Get calendar events within a date range
 */
export const getEvents = query({
  args: {
    userId: v.id("users"),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const now = Date.now();
    const startTime = args.startTime ?? now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    const endTime = args.endTime ?? now + 90 * 24 * 60 * 60 * 1000; // 90 days ahead

    // Get user's connections
    const connections = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "connected"))
      .collect();

    if (connections.length === 0) {
      return [];
    }

    // Get events from all connections
    const allEvents: Doc<"calendarEvents">[] = [];
    for (const connection of connections) {
      const events = await ctx.db
        .query("calendarEvents")
        .withIndex("by_connection", (q) => q.eq("connectionId", connection._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("startTime"), startTime),
            q.lte(q.field("startTime"), endTime),
            q.neq(q.field("status"), "cancelled")
          )
        )
        .take(limit);
      allEvents.push(...events);
    }

    // Sort by start time
    allEvents.sort((a, b) => a.startTime - b.startTime);

    // Enrich with related entity info
    const enrichedEvents = await Promise.all(
      allEvents.slice(0, limit).map(async (event) => {
        let relatedContact = null;
        let relatedCompany = null;
        let relatedDeal = null;

        if (event.relatedContactId) {
          relatedContact = await ctx.db.get(event.relatedContactId);
        }
        if (event.relatedCompanyId) {
          relatedCompany = await ctx.db.get(event.relatedCompanyId);
        }
        if (event.relatedDealId) {
          relatedDeal = await ctx.db.get(event.relatedDealId);
        }

        return {
          ...event,
          relatedContact,
          relatedCompany,
          relatedDeal,
        };
      })
    );

    return enrichedEvents;
  },
});

/**
 * Get events for a specific entity (contact, company, deal)
 */
export const getEventsByEntity = query({
  args: {
    entityType: v.union(
      v.literal("contact"),
      v.literal("company"),
      v.literal("deal")
    ),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let events: Doc<"calendarEvents">[] = [];

    if (args.entityType === "contact") {
      events = await ctx.db
        .query("calendarEvents")
        .withIndex("by_contact", (q) =>
          q.eq("relatedContactId", args.entityId as Id<"contacts">)
        )
        .take(limit);
    } else if (args.entityType === "company") {
      events = await ctx.db
        .query("calendarEvents")
        .withIndex("by_company", (q) =>
          q.eq("relatedCompanyId", args.entityId as Id<"companies">)
        )
        .take(limit);
    } else if (args.entityType === "deal") {
      events = await ctx.db
        .query("calendarEvents")
        .withIndex("by_deal", (q) =>
          q.eq("relatedDealId", args.entityId as Id<"deals">)
        )
        .take(limit);
    }

    return events.sort((a, b) => a.startTime - b.startTime);
  },
});

/**
 * Get upcoming events (for dashboard widgets)
 */
export const getUpcomingEvents = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const now = Date.now();
    const endTime = now + 7 * 24 * 60 * 60 * 1000; // Next 7 days

    // Get user's connections
    const connections = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "connected"))
      .collect();

    if (connections.length === 0) {
      return [];
    }

    // Get upcoming events from all connections
    const allEvents: Doc<"calendarEvents">[] = [];
    for (const connection of connections) {
      const events = await ctx.db
        .query("calendarEvents")
        .withIndex("by_connection", (q) => q.eq("connectionId", connection._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("startTime"), now),
            q.lte(q.field("startTime"), endTime),
            q.neq(q.field("status"), "cancelled")
          )
        )
        .take(limit * 2);
      allEvents.push(...events);
    }

    // Sort and limit
    return allEvents.sort((a, b) => a.startTime - b.startTime).slice(0, limit);
  },
});

/**
 * Get sync history for a connection
 */
export const getSyncHistory = query({
  args: {
    connectionId: v.id("calendarConnections"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    return ctx.db
      .query("calendarSyncLog")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .order("desc")
      .take(limit);
  },
});

// =============================================================================
// MUTATIONS - Connection Management
// =============================================================================

/**
 * Store OAuth tokens after successful authentication
 * Called by the OAuth callback handler
 */
export const storeCalendarConnection = mutation({
  args: {
    userId: v.id("users"),
    provider: v.union(
      v.literal("google"),
      v.literal("outlook"),
      v.literal("apple")
    ),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    email: v.string(),
    name: v.optional(v.string()),
    calendarId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if connection already exists
    const existing = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken ?? existing.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        email: args.email,
        name: args.name,
        calendarId: args.calendarId,
        status: "connected",
        errorMessage: undefined,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new connection
    const connectionId = await ctx.db.insert("calendarConnections", {
      provider: args.provider,
      userId: args.userId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      email: args.email,
      name: args.name,
      calendarId: args.calendarId,
      syncDirection: "two-way",
      syncEnabled: true,
      status: "connected",
      createdAt: now,
      updatedAt: now,
    });

    return connectionId;
  },
});

/**
 * Internal version for HTTP handler
 */
export const storeCalendarConnectionInternal = internalMutation({
  args: {
    userId: v.id("users"),
    provider: v.union(
      v.literal("google"),
      v.literal("outlook"),
      v.literal("apple")
    ),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    email: v.string(),
    name: v.optional(v.string()),
    calendarId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if connection already exists
    const existing = await ctx.db
      .query("calendarConnections")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .first();

    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken ?? existing.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        email: args.email,
        name: args.name,
        calendarId: args.calendarId,
        status: "connected",
        errorMessage: undefined,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new connection
    const connectionId = await ctx.db.insert("calendarConnections", {
      provider: args.provider,
      userId: args.userId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      email: args.email,
      name: args.name,
      calendarId: args.calendarId,
      syncDirection: "two-way",
      syncEnabled: true,
      status: "connected",
      createdAt: now,
      updatedAt: now,
    });

    return connectionId;
  },
});

/**
 * Update connection settings
 */
export const updateConnectionSettings = mutation({
  args: {
    connectionId: v.id("calendarConnections"),
    syncDirection: v.optional(v.union(v.literal("one-way"), v.literal("two-way"))),
    syncEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const updates: Partial<Doc<"calendarConnections">> = {
      updatedAt: Date.now(),
    };

    if (args.syncDirection !== undefined) {
      updates.syncDirection = args.syncDirection;
    }
    if (args.syncEnabled !== undefined) {
      updates.syncEnabled = args.syncEnabled;
    }

    await ctx.db.patch(args.connectionId, updates);
    return args.connectionId;
  },
});

/**
 * Disconnect a calendar
 */
export const disconnectCalendar = mutation({
  args: {
    connectionId: v.id("calendarConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    // Mark as disconnected (soft delete - keeps history)
    await ctx.db.patch(args.connectionId, {
      status: "disconnected",
      accessToken: "", // Clear tokens
      refreshToken: undefined,
      syncEnabled: false,
      updatedAt: Date.now(),
    });

    return args.connectionId;
  },
});

/**
 * Delete a calendar connection and all its events
 */
export const deleteConnection = mutation({
  args: {
    connectionId: v.id("calendarConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    // Delete all events for this connection
    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .collect();

    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    // Delete sync logs
    const logs = await ctx.db
      .query("calendarSyncLog")
      .withIndex("by_connection", (q) => q.eq("connectionId", args.connectionId))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    // Delete the connection
    await ctx.db.delete(args.connectionId);

    return args.connectionId;
  },
});

// =============================================================================
// MUTATIONS - Event Management
// =============================================================================

/**
 * Create a calendar event (from CRM)
 * This creates the event locally and optionally syncs to external calendar
 */
export const createCalendarEvent = mutation({
  args: {
    connectionId: v.id("calendarConnections"),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    isAllDay: v.optional(v.boolean()),
    attendees: v.optional(
      v.array(
        v.object({
          email: v.string(),
          name: v.optional(v.string()),
        })
      )
    ),
    relatedContactId: v.optional(v.id("contacts")),
    relatedCompanyId: v.optional(v.id("companies")),
    relatedDealId: v.optional(v.id("deals")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Calendar connection not found");
    }

    if (connection.status !== "connected") {
      throw new Error("Calendar is not connected");
    }

    // Generate a temporary external ID (will be replaced after sync)
    const tempExternalId = `crm_${now}_${Math.random().toString(36).substr(2, 9)}`;

    const eventId = await ctx.db.insert("calendarEvents", {
      connectionId: args.connectionId,
      externalEventId: tempExternalId,
      title: args.title,
      description: args.description,
      location: args.location,
      startTime: args.startTime,
      endTime: args.endTime,
      isAllDay: args.isAllDay ?? false,
      status: "confirmed",
      attendees: args.attendees?.map((a) => ({
        ...a,
        responseStatus: "needsAction" as const,
      })),
      relatedContactId: args.relatedContactId,
      relatedCompanyId: args.relatedCompanyId,
      relatedDealId: args.relatedDealId,
      syncSource: "crm",
      createdAt: now,
      updatedAt: now,
    });

    // Also create a meeting activity for CRM tracking
    if (args.relatedContactId || args.relatedCompanyId || args.relatedDealId) {
      let relatedToType: "contact" | "company" | "deal" = "contact";
      let relatedToId = "";

      if (args.relatedContactId) {
        relatedToType = "contact";
        relatedToId = args.relatedContactId;
      } else if (args.relatedCompanyId) {
        relatedToType = "company";
        relatedToId = args.relatedCompanyId;
      } else if (args.relatedDealId) {
        relatedToType = "deal";
        relatedToId = args.relatedDealId;
      }

      const activityId = await ctx.db.insert("activities", {
        type: "meeting",
        subject: args.title,
        description: args.description,
        relatedToType,
        relatedToId,
        dueDate: args.startTime,
        duration: Math.round((args.endTime - args.startTime) / 60000), // minutes
        createdAt: now,
        updatedAt: now,
      });

      // Link the event to the activity
      await ctx.db.patch(eventId, {
        relatedActivityId: activityId,
      });
    }

    return eventId;
  },
});

/**
 * Update a calendar event
 */
export const updateCalendarEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("confirmed"),
        v.literal("tentative"),
        v.literal("cancelled")
      )
    ),
    relatedContactId: v.optional(v.id("contacts")),
    relatedCompanyId: v.optional(v.id("companies")),
    relatedDealId: v.optional(v.id("deals")),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;

    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const updateData: Partial<Doc<"calendarEvents">> = {
      updatedAt: Date.now(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.startTime !== undefined) updateData.startTime = updates.startTime;
    if (updates.endTime !== undefined) updateData.endTime = updates.endTime;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.relatedContactId !== undefined) updateData.relatedContactId = updates.relatedContactId;
    if (updates.relatedCompanyId !== undefined) updateData.relatedCompanyId = updates.relatedCompanyId;
    if (updates.relatedDealId !== undefined) updateData.relatedDealId = updates.relatedDealId;

    await ctx.db.patch(eventId, updateData);

    // Update linked activity if exists
    if (event.relatedActivityId && (updates.title || updates.description || updates.startTime || updates.endTime)) {
      const activityUpdates: Partial<Doc<"activities">> = {
        updatedAt: Date.now(),
      };
      if (updates.title) activityUpdates.subject = updates.title;
      if (updates.description) activityUpdates.description = updates.description;
      if (updates.startTime) activityUpdates.dueDate = updates.startTime;
      if (updates.startTime && updates.endTime) {
        activityUpdates.duration = Math.round((updates.endTime - updates.startTime) / 60000);
      }

      await ctx.db.patch(event.relatedActivityId, activityUpdates);
    }

    return eventId;
  },
});

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Delete linked activity if exists
    if (event.relatedActivityId) {
      await ctx.db.delete(event.relatedActivityId);
    }

    await ctx.db.delete(args.eventId);

    return args.eventId;
  },
});

// =============================================================================
// INTERNAL MUTATIONS - For sync operations
// =============================================================================

/**
 * Store events from external calendar sync
 */
export const upsertExternalEvents = internalMutation({
  args: {
    connectionId: v.id("calendarConnections"),
    events: v.array(
      v.object({
        externalEventId: v.string(),
        iCalUID: v.optional(v.string()),
        title: v.string(),
        description: v.optional(v.string()),
        location: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
        isAllDay: v.boolean(),
        timezone: v.optional(v.string()),
        status: v.union(
          v.literal("confirmed"),
          v.literal("tentative"),
          v.literal("cancelled")
        ),
        attendees: v.optional(
          v.array(
            v.object({
              email: v.string(),
              name: v.optional(v.string()),
              responseStatus: v.optional(
                v.union(
                  v.literal("accepted"),
                  v.literal("declined"),
                  v.literal("tentative"),
                  v.literal("needsAction")
                )
              ),
              organizer: v.optional(v.boolean()),
            })
          )
        ),
        recurringEventId: v.optional(v.string()),
        recurrenceRule: v.optional(v.string()),
        etag: v.optional(v.string()),
        colorId: v.optional(v.string()),
        lastModifiedExternal: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let created = 0;
    let updated = 0;

    for (const eventData of args.events) {
      // Check if event already exists
      const existing = await ctx.db
        .query("calendarEvents")
        .withIndex("by_external_id", (q) =>
          q.eq("connectionId", args.connectionId).eq("externalEventId", eventData.externalEventId)
        )
        .first();

      if (existing) {
        // Update existing event
        await ctx.db.patch(existing._id, {
          ...eventData,
          syncSource: "external",
          updatedAt: now,
        });
        updated++;
      } else {
        // Create new event
        await ctx.db.insert("calendarEvents", {
          connectionId: args.connectionId,
          ...eventData,
          syncSource: "external",
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    return { created, updated };
  },
});

/**
 * Update connection status after sync
 */
export const updateConnectionSyncStatus = internalMutation({
  args: {
    connectionId: v.id("calendarConnections"),
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("token_expired")
    ),
    syncToken: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.connectionId, {
      status: args.status,
      lastSyncedAt: args.status === "connected" ? now : undefined,
      syncToken: args.syncToken,
      errorMessage: args.errorMessage,
      updatedAt: now,
    });
  },
});

/**
 * Log sync operation
 */
export const logSyncOperation = internalMutation({
  args: {
    connectionId: v.id("calendarConnections"),
    syncType: v.union(
      v.literal("full"),
      v.literal("incremental"),
      v.literal("push")
    ),
    direction: v.union(v.literal("pull"), v.literal("push")),
    status: v.union(
      v.literal("started"),
      v.literal("completed"),
      v.literal("failed")
    ),
    eventsCreated: v.optional(v.number()),
    eventsUpdated: v.optional(v.number()),
    eventsDeleted: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const logId = await ctx.db.insert("calendarSyncLog", {
      connectionId: args.connectionId,
      syncType: args.syncType,
      direction: args.direction,
      status: args.status,
      eventsCreated: args.eventsCreated,
      eventsUpdated: args.eventsUpdated,
      eventsDeleted: args.eventsDeleted,
      errorMessage: args.errorMessage,
      errorCode: args.errorCode,
      startedAt: now,
      completedAt: args.status !== "started" ? now : undefined,
    });

    return logId;
  },
});

/**
 * Update tokens after refresh
 */
export const updateTokens = internalMutation({
  args: {
    connectionId: v.id("calendarConnections"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Partial<Doc<"calendarConnections">> = {
      accessToken: args.accessToken,
      status: "connected",
      updatedAt: Date.now(),
    };

    if (args.refreshToken) {
      updates.refreshToken = args.refreshToken;
    }
    if (args.tokenExpiresAt) {
      updates.tokenExpiresAt = args.tokenExpiresAt;
    }

    await ctx.db.patch(args.connectionId, updates);
  },
});

// =============================================================================
// ACTIONS - External API Calls
// =============================================================================

/**
 * Sync calendar events from Google Calendar
 */
export const syncCalendarEvents = action({
  args: {
    connectionId: v.id("calendarConnections"),
    fullSync: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get connection details (we need to query the database)
    const connection = await ctx.runQuery(internal.calendar.getConnectionInternal, {
      connectionId: args.connectionId,
    });

    if (!connection) {
      throw new Error("Connection not found");
    }

    if (connection.status !== "connected" && connection.status !== "token_expired") {
      throw new Error("Calendar is not connected");
    }

    // Log sync start
    await ctx.runMutation(internal.calendar.logSyncOperation, {
      connectionId: args.connectionId,
      syncType: args.fullSync ? "full" : "incremental",
      direction: "pull",
      status: "started",
    });

    try {
      // Check if token needs refresh
      let accessToken = connection.accessToken;
      if (connection.tokenExpiresAt && connection.tokenExpiresAt < Date.now()) {
        // Token expired, try to refresh
        if (!connection.refreshToken) {
          await ctx.runMutation(internal.calendar.updateConnectionSyncStatus, {
            connectionId: args.connectionId,
            status: "token_expired",
            errorMessage: "Token expired and no refresh token available",
          });
          throw new Error("Token expired and no refresh token available");
        }

        // Refresh the token
        accessToken = await refreshGoogleToken(ctx, args.connectionId, connection.refreshToken);
      }

      // Fetch events from Google Calendar
      const result = await fetchGoogleCalendarEvents(
        accessToken,
        connection.calendarId || "primary",
        args.fullSync ? undefined : connection.syncToken
      );

      // Parse and store events
      const parsedEvents = result.events.map(parseGoogleEvent);

      const syncResult = await ctx.runMutation(internal.calendar.upsertExternalEvents, {
        connectionId: args.connectionId,
        events: parsedEvents,
      });
      const created: number = syncResult.created;
      const updated: number = syncResult.updated;

      // Update sync status
      await ctx.runMutation(internal.calendar.updateConnectionSyncStatus, {
        connectionId: args.connectionId,
        status: "connected",
        syncToken: result.nextSyncToken,
      });

      // Log sync completion
      await ctx.runMutation(internal.calendar.logSyncOperation, {
        connectionId: args.connectionId,
        syncType: args.fullSync ? "full" : "incremental",
        direction: "pull",
        status: "completed",
        eventsCreated: created,
        eventsUpdated: updated,
      });

      return { success: true, created, updated };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Update status
      await ctx.runMutation(internal.calendar.updateConnectionSyncStatus, {
        connectionId: args.connectionId,
        status: "error",
        errorMessage,
      });

      // Log failure
      await ctx.runMutation(internal.calendar.logSyncOperation, {
        connectionId: args.connectionId,
        syncType: args.fullSync ? "full" : "incremental",
        direction: "pull",
        status: "failed",
        errorMessage,
      });

      throw error;
    }
  },
});

/**
 * Push a CRM event to Google Calendar
 */
export const pushEventToCalendar = action({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    // Get event and connection details
    const event = await ctx.runQuery(internal.calendar.getEventInternal, {
      eventId: args.eventId,
    });

    if (!event) {
      throw new Error("Event not found");
    }

    const connection = await ctx.runQuery(internal.calendar.getConnectionInternal, {
      connectionId: event.connectionId,
    });

    if (!connection || connection.status !== "connected") {
      throw new Error("Calendar is not connected");
    }

    // Check if sync direction allows pushing
    if (connection.syncDirection !== "two-way") {
      throw new Error("Calendar is set to one-way sync only");
    }

    try {
      // Check if token needs refresh
      let accessToken = connection.accessToken;
      if (connection.tokenExpiresAt && connection.tokenExpiresAt < Date.now()) {
        if (!connection.refreshToken) {
          throw new Error("Token expired and no refresh token available");
        }
        accessToken = await refreshGoogleToken(ctx, event.connectionId, connection.refreshToken);
      }

      // Create event in Google Calendar
      const googleEvent = await createGoogleCalendarEvent(
        accessToken,
        connection.calendarId || "primary",
        {
          title: event.title,
          description: event.description,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
          isAllDay: event.isAllDay,
          attendees: event.attendees,
        }
      );

      // Update local event with Google's event ID
      await ctx.runMutation(internal.calendar.updateEventExternalId, {
        eventId: args.eventId,
        externalEventId: googleEvent.id,
        etag: googleEvent.etag,
      });

      return { success: true, googleEventId: googleEvent.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to push event to calendar: ${errorMessage}`);
    }
  },
});

// =============================================================================
// INTERNAL QUERIES - For actions
// =============================================================================

export const getConnectionInternal = internalQuery({
  args: {
    connectionId: v.id("calendarConnections"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.connectionId);
  },
});

export const getEventInternal = internalQuery({
  args: {
    eventId: v.id("calendarEvents"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.eventId);
  },
});

export const updateEventExternalId = internalMutation({
  args: {
    eventId: v.id("calendarEvents"),
    externalEventId: v.string(),
    etag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      externalEventId: args.externalEventId,
      etag: args.etag,
      updatedAt: Date.now(),
    });
  },
});

// =============================================================================
// HELPER FUNCTIONS - Google Calendar API
// =============================================================================

async function refreshGoogleToken(
  ctx: any,
  connectionId: Id<"calendarConnections">,
  refreshToken: string
): Promise<string> {
  // Get OAuth credentials from environment
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  // Update tokens in database
  await ctx.runMutation(internal.calendar.updateTokens, {
    connectionId,
    accessToken: data.access_token,
    refreshToken: data.refresh_token, // May be returned
    tokenExpiresAt: Date.now() + data.expires_in * 1000,
  });

  return data.access_token;
}

async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  syncToken?: string
): Promise<{ events: GoogleCalendarEvent[]; nextSyncToken?: string }> {
  const params = new URLSearchParams({
    maxResults: "250",
    singleEvents: "true",
    orderBy: "startTime",
  });

  if (syncToken) {
    params.set("syncToken", syncToken);
  } else {
    // Full sync - get events from 30 days ago
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    params.set("timeMin", timeMin);
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 410) {
      // Sync token invalid, need full sync
      throw new Error("SYNC_TOKEN_INVALID");
    }
    const error = await response.text();
    throw new Error(`Failed to fetch calendar events: ${error}`);
  }

  const data = await response.json();

  return {
    events: data.items || [],
    nextSyncToken: data.nextSyncToken,
  };
}

async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    title: string;
    description?: string;
    location?: string;
    startTime: number;
    endTime: number;
    isAllDay: boolean;
    attendees?: Array<{ email: string; name?: string }>;
  }
): Promise<{ id: string; etag?: string }> {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);

  const googleEvent: any = {
    summary: event.title,
    description: event.description,
    location: event.location,
  };

  if (event.isAllDay) {
    googleEvent.start = { date: startDate.toISOString().split("T")[0] };
    googleEvent.end = { date: endDate.toISOString().split("T")[0] };
  } else {
    googleEvent.start = { dateTime: startDate.toISOString() };
    googleEvent.end = { dateTime: endDate.toISOString() };
  }

  if (event.attendees && event.attendees.length > 0) {
    googleEvent.attendees = event.attendees.map((a) => ({
      email: a.email,
      displayName: a.name,
    }));
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(googleEvent),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create calendar event: ${error}`);
  }

  const data = await response.json();
  return { id: data.id, etag: data.etag };
}

function parseGoogleEvent(event: GoogleCalendarEvent): {
  externalEventId: string;
  iCalUID?: string;
  title: string;
  description?: string;
  location?: string;
  startTime: number;
  endTime: number;
  isAllDay: boolean;
  timezone?: string;
  status: "confirmed" | "tentative" | "cancelled";
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus?: "accepted" | "declined" | "tentative" | "needsAction";
    organizer?: boolean;
  }>;
  recurringEventId?: string;
  recurrenceRule?: string;
  etag?: string;
  colorId?: string;
  lastModifiedExternal?: number;
} {
  const isAllDay = !!event.start.date;

  let startTime: number;
  let endTime: number;

  if (isAllDay) {
    startTime = new Date(event.start.date!).getTime();
    endTime = new Date(event.end.date!).getTime();
  } else {
    startTime = new Date(event.start.dateTime!).getTime();
    endTime = new Date(event.end.dateTime!).getTime();
  }

  let status: "confirmed" | "tentative" | "cancelled" = "confirmed";
  if (event.status === "tentative") status = "tentative";
  if (event.status === "cancelled") status = "cancelled";

  return {
    externalEventId: event.id,
    iCalUID: event.iCalUID,
    title: event.summary || "(No title)",
    description: event.description,
    location: event.location,
    startTime,
    endTime,
    isAllDay,
    timezone: event.start.timeZone,
    status,
    attendees: event.attendees?.map((a) => ({
      email: a.email,
      name: a.displayName,
      responseStatus: parseResponseStatus(a.responseStatus),
      organizer: a.organizer,
    })),
    recurringEventId: event.recurringEventId,
    recurrenceRule: event.recurrence?.[0],
    etag: event.etag,
    colorId: event.colorId,
    lastModifiedExternal: event.updated ? new Date(event.updated).getTime() : undefined,
  };
}

function parseResponseStatus(
  status?: string
): "accepted" | "declined" | "tentative" | "needsAction" | undefined {
  switch (status) {
    case "accepted":
      return "accepted";
    case "declined":
      return "declined";
    case "tentative":
      return "tentative";
    case "needsAction":
      return "needsAction";
    default:
      return undefined;
  }
}

// =============================================================================
// OAUTH HELPER - Generate OAuth URL
// =============================================================================

/**
 * Generate Google OAuth URL for calendar connection
 */
export const getGoogleOAuthUrl = query({
  args: {
    userId: v.id("users"),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error("Google OAuth not configured");
    }

    const state = Buffer.from(
      JSON.stringify({ userId: args.userId })
    ).toString("base64");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: args.redirectUri,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },
});
