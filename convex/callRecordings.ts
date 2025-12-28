import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get a single call recording by ID
 */
export const getRecording = query({
  args: { id: v.id("callRecordings") },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.id);
    if (!recording) return null;

    // Get the audio file URL if storageId exists
    const url = recording.storageId
      ? await ctx.storage.getUrl(recording.storageId)
      : null;

    // Get related activity
    const activity = recording.activityId
      ? await ctx.db.get(recording.activityId)
      : null;

    // Get uploader info
    const uploader = recording.uploadedBy
      ? await ctx.db.get(recording.uploadedBy)
      : null;

    return {
      ...recording,
      url,
      activity,
      uploader,
    };
  },
});

/**
 * Get recording by activity ID
 */
export const getByActivity = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const recording = await ctx.db
      .query("callRecordings")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .first();

    if (!recording) return null;

    const url = recording.storageId
      ? await ctx.storage.getUrl(recording.storageId)
      : null;

    return {
      ...recording,
      url,
    };
  },
});

/**
 * Get all recordings for a contact (through activities)
 */
export const getRecordingsByContact = query({
  args: {
    contactId: v.id("contacts"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const cursor = args.cursor ?? Date.now();

    // Get all call recordings for this contact
    const recordings = await ctx.db
      .query("callRecordings")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    const enrichedRecordings = await Promise.all(
      recordings.map(async (recording) => {
        const url = recording.storageId
          ? await ctx.storage.getUrl(recording.storageId)
          : null;
        const activity = recording.activityId
          ? await ctx.db.get(recording.activityId)
          : null;

        return {
          ...recording,
          url,
          activity,
        };
      })
    );

    // Filter and sort by recordedAt
    const validRecordings = enrichedRecordings
      .filter((r) => r.recordedAt < cursor)
      .sort((a, b) => b.recordedAt - a.recordedAt)
      .slice(0, limit + 1);

    const hasMore = validRecordings.length > limit;
    const items = validRecordings.slice(0, limit);

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.recordedAt : null,
      hasMore,
    };
  },
});

/**
 * List all recordings with pagination
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    transcriptionStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const cursor = args.cursor ?? Date.now();

    let recordings = await ctx.db
      .query("callRecordings")
      .withIndex("by_recorded", (q) => q.lt("recordedAt", cursor))
      .order("desc")
      .collect();

    // Filter by transcription status if specified
    if (args.transcriptionStatus) {
      recordings = recordings.filter(
        (r) => r.transcriptionStatus === args.transcriptionStatus
      );
    }

    const paginatedRecordings = recordings.slice(0, limit + 1);
    const hasMore = paginatedRecordings.length > limit;
    const items = paginatedRecordings.slice(0, limit);

    // Enrich with URLs and activity info
    const enrichedItems = await Promise.all(
      items.map(async (recording) => {
        const url = recording.storageId
          ? await ctx.storage.getUrl(recording.storageId)
          : null;
        const activity = recording.activityId
          ? await ctx.db.get(recording.activityId)
          : null;
        const uploader = recording.uploadedBy
          ? await ctx.db.get(recording.uploadedBy)
          : null;

        return {
          ...recording,
          url,
          activity,
          uploader,
        };
      })
    );

    return {
      items: enrichedItems,
      nextCursor: hasMore ? items[items.length - 1]?.recordedAt : null,
      hasMore,
    };
  },
});

/**
 * Search transcriptions (simple text search)
 */
export const searchTranscriptions = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    if (args.searchTerm.length < 2) {
      return [];
    }

    // Get all recordings with transcriptions and filter client-side
    const allRecordings = await ctx.db
      .query("callRecordings")
      .filter((q) => q.neq(q.field("transcription"), undefined))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    const filtered = allRecordings.filter(
      (r) =>
        r.transcription &&
        r.transcription.toLowerCase().includes(searchLower)
    );

    const results = filtered.slice(0, limit);

    // Enrich with URLs and activity info
    const enrichedResults = await Promise.all(
      results.map(async (recording) => {
        const url = recording.storageId
          ? await ctx.storage.getUrl(recording.storageId)
          : null;
        const activity = recording.activityId
          ? await ctx.db.get(recording.activityId)
          : null;

        // Get related entity from activity
        let relatedEntity = null;
        if (activity) {
          if (activity.relatedToType === "contact") {
            relatedEntity = await ctx.db.get(
              activity.relatedToId as Id<"contacts">
            );
          } else if (activity.relatedToType === "company") {
            relatedEntity = await ctx.db.get(
              activity.relatedToId as Id<"companies">
            );
          } else if (activity.relatedToType === "deal") {
            relatedEntity = await ctx.db.get(
              activity.relatedToId as Id<"deals">
            );
          }
        }

        return {
          ...recording,
          url,
          activity,
          relatedEntity,
        };
      })
    );

    return enrichedResults;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Generate an upload URL for recording upload
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Upload a recording (create record)
 */
export const uploadRecording = mutation({
  args: {
    recordingUrl: v.string(),
    duration: v.number(),
    activityId: v.optional(v.id("activities")),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    participants: v.optional(v.array(v.string())),
    storageId: v.optional(v.id("_storage")),
    uploadedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create the recording record
    const recordingId = await ctx.db.insert("callRecordings", {
      recordingUrl: args.recordingUrl,
      duration: args.duration,
      activityId: args.activityId,
      contactId: args.contactId,
      dealId: args.dealId,
      participants: args.participants,
      storageId: args.storageId,
      uploadedBy: args.uploadedBy,
      transcriptionStatus: "pending",
      analysisStatus: "pending",
      recordedAt: now,
      createdAt: now,
    });

    // Log the upload
    await ctx.db.insert("activityLog", {
      action: "recording_uploaded",
      entityType: "callRecording",
      entityId: recordingId,
      metadata: {
        duration: args.duration,
        activityId: args.activityId,
      },
      timestamp: now,
      system: true,
    });

    return recordingId;
  },
});

/**
 * Delete a recording
 */
export const deleteRecording = mutation({
  args: { id: v.id("callRecordings") },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.id);
    if (!recording) {
      throw new Error("Recording not found");
    }

    // Delete the file from storage if it exists
    if (recording.storageId) {
      await ctx.storage.delete(recording.storageId);
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "recording_deleted",
      entityType: "callRecording",
      entityId: args.id,
      metadata: {
        duration: recording.duration,
        hadTranscription: !!recording.transcription,
      },
      timestamp: Date.now(),
      system: true,
    });

    // Delete the recording record
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Request transcription for a recording
 */
export const requestTranscription = mutation({
  args: { id: v.id("callRecordings") },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.id);
    if (!recording) {
      throw new Error("Recording not found");
    }

    if (recording.transcriptionStatus === "processing") {
      throw new Error("Transcription already in progress");
    }

    if (recording.transcriptionStatus === "completed") {
      throw new Error("Recording already transcribed");
    }

    // Update status to processing
    await ctx.db.patch(args.id, {
      transcriptionStatus: "processing",
      updatedAt: Date.now(),
    });

    // In a real implementation, this would trigger an external transcription service
    return { success: true, message: "Transcription queued" };
  },
});

/**
 * Update transcription result
 */
export const updateTranscription = mutation({
  args: {
    id: v.id("callRecordings"),
    transcription: v.string(),
    transcriptionStatus: v.union(
      v.literal("completed"),
      v.literal("failed")
    ),
    transcribedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.id);
    if (!recording) {
      throw new Error("Recording not found");
    }

    await ctx.db.patch(args.id, {
      transcription: args.transcription,
      transcriptionStatus: args.transcriptionStatus,
      transcribedAt: args.transcribedAt ?? Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update call analysis (sentiment, key topics, summary, action items)
 */
export const updateAnalysis = mutation({
  args: {
    id: v.id("callRecordings"),
    sentiment: v.optional(
      v.union(
        v.literal("positive"),
        v.literal("neutral"),
        v.literal("negative")
      )
    ),
    summary: v.optional(v.string()),
    keyTopics: v.optional(v.array(v.string())),
    actionItems: v.optional(v.array(v.string())),
    analysisStatus: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    analysisError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const recording = await ctx.db.get(id);
    if (!recording) {
      throw new Error("Recording not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    // Also update the linked activity's sentiment if available
    if (recording.activityId && updates.sentiment) {
      await ctx.db.patch(recording.activityId, {
        sentiment: updates.sentiment,
        aiSummary: updates.summary,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Request analysis for a recording
 */
export const requestAnalysis = mutation({
  args: { id: v.id("callRecordings") },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.id);
    if (!recording) {
      throw new Error("Recording not found");
    }

    if (!recording.transcription) {
      throw new Error("Transcription required before analysis");
    }

    if (recording.analysisStatus === "processing") {
      throw new Error("Analysis already in progress");
    }

    // Update status to processing
    await ctx.db.patch(args.id, {
      analysisStatus: "processing",
      analysisError: undefined,
      updatedAt: Date.now(),
    });

    // In a real implementation, this would trigger an external AI service
    return { success: true, message: "Analysis queued" };
  },
});

/**
 * Link a recording to an activity
 */
export const linkToActivity = mutation({
  args: {
    recordingId: v.id("callRecordings"),
    activityId: v.id("activities"),
  },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) {
      throw new Error("Recording not found");
    }

    const activity = await ctx.db.get(args.activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

    if (activity.type !== "call") {
      throw new Error("Can only link recordings to call activities");
    }

    const now = Date.now();

    // Update recording
    await ctx.db.patch(args.recordingId, {
      activityId: args.activityId,
    });

    // Update activity
    await ctx.db.patch(args.activityId, {
      duration: recording.duration / 60, // Convert seconds to minutes
      updatedAt: now,
    });

    return { success: true };
  },
});

// =============================================================================
// ACTIONS (for external API calls)
// =============================================================================

/**
 * Process transcription (would call external transcription service)
 * This is a placeholder - in production, this would call Whisper API, AssemblyAI, etc.
 */
export const processTranscription = action({
  args: { recordingId: v.id("callRecordings") },
  handler: async (ctx, args) => {
    // In production, this would:
    // 1. Get the recording URL
    // 2. Call transcription API (Whisper, AssemblyAI, Deepgram, etc.)
    // 3. Update the recording with transcription results

    // For now, we'll just simulate the process
    // The actual implementation would depend on your transcription provider

    // Example pseudo-code:
    // const recording = await ctx.runQuery(internal.callRecordings.getRecording, { id: args.recordingId });
    // const transcriptionResult = await callTranscriptionAPI(recording.url);
    // await ctx.runMutation(internal.callRecordings.updateTranscription, {
    //   id: args.recordingId,
    //   transcription: transcriptionResult.text,
    //   transcriptionSegments: transcriptionResult.segments,
    //   transcriptionStatus: "completed",
    // });

    console.log(`Transcription processing started for recording: ${args.recordingId}`);

    return {
      success: true,
      message: "Transcription processing initiated. This is a placeholder - implement actual transcription service.",
    };
  },
});

/**
 * Analyze call (sentiment, key phrases, summary)
 * This is a placeholder - in production, this would call LLM API
 */
export const analyzeCall = action({
  args: { recordingId: v.id("callRecordings") },
  handler: async (ctx, args) => {
    // In production, this would:
    // 1. Get the transcription
    // 2. Call LLM API (OpenAI, Anthropic, etc.) for analysis
    // 3. Update the recording with analysis results

    // Example pseudo-code:
    // const recording = await ctx.runQuery(internal.callRecordings.getRecording, { id: args.recordingId });
    // const analysisResult = await analyzeWithLLM(recording.transcription);
    // await ctx.runMutation(internal.callRecordings.updateAnalysis, {
    //   id: args.recordingId,
    //   sentiment: analysisResult.sentiment,
    //   keyPhrases: analysisResult.keyPhrases,
    //   summary: analysisResult.summary,
    //   topics: analysisResult.topics,
    //   actionItems: analysisResult.actionItems,
    //   analysisStatus: "completed",
    // });

    console.log(`Analysis processing started for recording: ${args.recordingId}`);

    return {
      success: true,
      message: "Analysis processing initiated. This is a placeholder - implement actual LLM analysis.",
    };
  },
});
