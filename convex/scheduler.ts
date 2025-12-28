import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";

// =============================================================================
// TYPES
// =============================================================================

type LocationType = "zoom" | "meet" | "phone" | "inPerson" | "custom";
type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "noShow";

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface TimeSlot {
  startTime: number;
  endTime: number;
  available: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique booking link slug
 */
function generateBookingSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const random = Math.random().toString(36).substring(2, 8);
  return `${base}-${random}`;
}

/**
 * Parse time string (e.g., "09:00") to minutes from midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Get day of week from timestamp (0 = Sunday)
 */
function getDayOfWeek(timestamp: number): number {
  return new Date(timestamp).getDay();
}

/**
 * Get start of day timestamp
 */
function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Format time from minutes to HH:MM
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// =============================================================================
// MEETING TYPE QUERIES
// =============================================================================

/**
 * List all meeting types
 */
export const listMeetingTypes = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let meetingTypes;

    if (args.createdBy) {
      meetingTypes = await ctx.db
        .query("meetingTypes")
        .withIndex("by_created_by", (q) => q.eq("createdBy", args.createdBy))
        .collect();
    } else if (args.activeOnly) {
      meetingTypes = await ctx.db
        .query("meetingTypes")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    } else {
      meetingTypes = await ctx.db.query("meetingTypes").collect();
    }

    return meetingTypes.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single meeting type by ID
 */
export const getMeetingType = query({
  args: {
    id: v.id("meetingTypes"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

/**
 * Get a meeting type by booking link (public)
 */
export const getMeetingTypeBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const meetingType = await ctx.db
      .query("meetingTypes")
      .withIndex("by_booking_link", (q) => q.eq("bookingLink", args.slug))
      .first();

    if (!meetingType || !meetingType.isActive) {
      return null;
    }

    // Get the creator info
    let creator = null;
    if (meetingType.createdBy) {
      creator = await ctx.db.get(meetingType.createdBy);
    }

    return {
      ...meetingType,
      creator: creator
        ? {
            firstName: creator.firstName,
            lastName: creator.lastName,
            avatarUrl: creator.avatarUrl,
          }
        : null,
    };
  },
});

// =============================================================================
// MEETING TYPE MUTATIONS
// =============================================================================

/**
 * Create a new meeting type
 */
export const createMeetingType = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    color: v.string(),
    location: v.union(
      v.literal("zoom"),
      v.literal("meet"),
      v.literal("phone"),
      v.literal("inPerson"),
      v.literal("custom")
    ),
    locationDetails: v.optional(v.string()),
    buffer: v.optional(v.number()),
    minNotice: v.optional(v.number()),
    maxFuture: v.optional(v.number()),
    availability: v.array(
      v.object({
        dayOfWeek: v.number(),
        startTime: v.string(),
        endTime: v.string(),
        enabled: v.boolean(),
      })
    ),
    bookingLink: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate a unique booking link if not provided
    let bookingLink = args.bookingLink || generateBookingSlug(args.name);

    // Check if booking link is unique
    const existing = await ctx.db
      .query("meetingTypes")
      .withIndex("by_booking_link", (q) => q.eq("bookingLink", bookingLink))
      .first();

    if (existing) {
      // Append random string to make it unique
      bookingLink = generateBookingSlug(args.name);
    }

    const meetingTypeId = await ctx.db.insert("meetingTypes", {
      name: args.name,
      description: args.description,
      duration: args.duration,
      color: args.color,
      location: args.location,
      locationDetails: args.locationDetails,
      buffer: args.buffer ?? 0,
      minNotice: args.minNotice ?? 24, // 24 hours minimum notice by default
      maxFuture: args.maxFuture ?? 60, // 60 days in the future by default
      availability: args.availability,
      bookingLink,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return meetingTypeId;
  },
});

/**
 * Update a meeting type
 */
export const updateMeetingType = mutation({
  args: {
    id: v.id("meetingTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    color: v.optional(v.string()),
    location: v.optional(
      v.union(
        v.literal("zoom"),
        v.literal("meet"),
        v.literal("phone"),
        v.literal("inPerson"),
        v.literal("custom")
      )
    ),
    locationDetails: v.optional(v.string()),
    buffer: v.optional(v.number()),
    minNotice: v.optional(v.number()),
    maxFuture: v.optional(v.number()),
    availability: v.optional(
      v.array(
        v.object({
          dayOfWeek: v.number(),
          startTime: v.string(),
          endTime: v.string(),
          enabled: v.boolean(),
        })
      )
    ),
    bookingLink: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const meetingType = await ctx.db.get(id);
    if (!meetingType) {
      throw new Error("Meeting type not found");
    }

    // Check if booking link is unique (if being updated)
    if (updates.bookingLink && updates.bookingLink !== meetingType.bookingLink) {
      const existing = await ctx.db
        .query("meetingTypes")
        .withIndex("by_booking_link", (q) => q.eq("bookingLink", updates.bookingLink!))
        .first();

      if (existing && existing._id !== id) {
        throw new Error("Booking link already exists");
      }
    }

    const updateData: Partial<Doc<"meetingTypes">> = {
      updatedAt: Date.now(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.locationDetails !== undefined) updateData.locationDetails = updates.locationDetails;
    if (updates.buffer !== undefined) updateData.buffer = updates.buffer;
    if (updates.minNotice !== undefined) updateData.minNotice = updates.minNotice;
    if (updates.maxFuture !== undefined) updateData.maxFuture = updates.maxFuture;
    if (updates.availability !== undefined) updateData.availability = updates.availability;
    if (updates.bookingLink !== undefined) updateData.bookingLink = updates.bookingLink;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

/**
 * Delete a meeting type
 */
export const deleteMeetingType = mutation({
  args: {
    id: v.id("meetingTypes"),
  },
  handler: async (ctx, args) => {
    const meetingType = await ctx.db.get(args.id);
    if (!meetingType) {
      throw new Error("Meeting type not found");
    }

    // Check if there are any bookings for this meeting type
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_meeting_type", (q) => q.eq("meetingTypeId", args.id))
      .first();

    if (bookings) {
      // Soft delete - mark as inactive instead
      await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() });
      return { deleted: false, deactivated: true };
    }

    await ctx.db.delete(args.id);
    return { deleted: true, deactivated: false };
  },
});

// =============================================================================
// AVAILABILITY QUERIES
// =============================================================================

/**
 * Get available time slots for a meeting type on a specific date range
 */
export const getAvailableSlots = query({
  args: {
    meetingTypeId: v.id("meetingTypes"),
    startDate: v.number(), // Start of date range
    endDate: v.number(), // End of date range
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const meetingType = await ctx.db.get(args.meetingTypeId);
    if (!meetingType || !meetingType.isActive) {
      return [];
    }

    const now = Date.now();
    const minNoticeMs = (meetingType.minNotice ?? 24) * 60 * 60 * 1000;
    const bufferMs = (meetingType.buffer ?? 0) * 60 * 1000;
    const durationMs = meetingType.duration * 60 * 1000;

    // Get existing bookings in the date range
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_meeting_type", (q) => q.eq("meetingTypeId", args.meetingTypeId))
      .filter((q) =>
        q.and(
          q.gte(q.field("scheduledAt"), args.startDate),
          q.lte(q.field("scheduledAt"), args.endDate),
          q.neq(q.field("status"), "cancelled")
        )
      )
      .collect();

    const slots: TimeSlot[] = [];

    // Iterate through each day in the range
    let currentDay = getStartOfDay(args.startDate);
    const endDay = getStartOfDay(args.endDate);

    while (currentDay <= endDay) {
      const dayOfWeek = getDayOfWeek(currentDay);
      const dayAvailability = meetingType.availability.find(
        (a) => a.dayOfWeek === dayOfWeek && a.enabled
      );

      if (dayAvailability) {
        const startMinutes = parseTimeToMinutes(dayAvailability.startTime);
        const endMinutes = parseTimeToMinutes(dayAvailability.endTime);

        // Generate slots for this day
        let slotStartMinutes = startMinutes;
        while (slotStartMinutes + meetingType.duration <= endMinutes) {
          const slotStart = currentDay + slotStartMinutes * 60 * 1000;
          const slotEnd = slotStart + durationMs;

          // Check if slot is in the future with minimum notice
          if (slotStart > now + minNoticeMs) {
            // Check if slot conflicts with existing bookings
            const hasConflict = existingBookings.some((booking) => {
              const bookingStart = booking.scheduledAt - bufferMs;
              const bookingEnd = booking.scheduledAt + booking.duration * 60 * 1000 + bufferMs;
              return slotStart < bookingEnd && slotEnd > bookingStart;
            });

            slots.push({
              startTime: slotStart,
              endTime: slotEnd,
              available: !hasConflict,
            });
          }

          // Move to next slot (using duration as interval)
          slotStartMinutes += meetingType.duration;
        }
      }

      // Move to next day
      currentDay += 24 * 60 * 60 * 1000;
    }

    return slots.filter((s) => s.available);
  },
});

// =============================================================================
// BOOKING MUTATIONS
// =============================================================================

/**
 * Create a new booking
 */
export const bookMeeting = mutation({
  args: {
    meetingTypeId: v.id("meetingTypes"),
    scheduledAt: v.number(),
    bookerName: v.string(),
    bookerEmail: v.string(),
    bookerPhone: v.optional(v.string()),
    notes: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get the meeting type
    const meetingType = await ctx.db.get(args.meetingTypeId);
    if (!meetingType || !meetingType.isActive) {
      throw new Error("Meeting type not found or inactive");
    }

    // Validate the time slot is available
    const minNoticeMs = (meetingType.minNotice ?? 24) * 60 * 60 * 1000;
    if (args.scheduledAt < now + minNoticeMs) {
      throw new Error("Time slot does not meet minimum notice requirement");
    }

    // Check for conflicts
    const bufferMs = (meetingType.buffer ?? 0) * 60 * 1000;
    const slotStart = args.scheduledAt - bufferMs;
    const slotEnd = args.scheduledAt + meetingType.duration * 60 * 1000 + bufferMs;

    const conflicts = await ctx.db
      .query("bookings")
      .withIndex("by_meeting_type", (q) => q.eq("meetingTypeId", args.meetingTypeId))
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "cancelled"),
          q.or(
            q.and(
              q.gte(q.field("scheduledAt"), slotStart),
              q.lt(q.field("scheduledAt"), slotEnd)
            ),
            q.and(
              q.lt(q.field("scheduledAt"), slotStart),
              q.gt(
                q.add(q.field("scheduledAt"), q.mul(q.field("duration"), 60 * 1000)),
                slotStart
              )
            )
          )
        )
      )
      .first();

    if (conflicts) {
      throw new Error("Time slot is no longer available");
    }

    // Check if contact exists with this email
    let contactId: Id<"contacts"> | undefined;
    const existingContact = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", args.bookerEmail))
      .first();

    if (existingContact) {
      contactId = existingContact._id;
    }

    // Create the booking
    const bookingId = await ctx.db.insert("bookings", {
      meetingTypeId: args.meetingTypeId,
      contactId,
      bookerName: args.bookerName,
      bookerEmail: args.bookerEmail,
      bookerPhone: args.bookerPhone,
      scheduledAt: args.scheduledAt,
      duration: meetingType.duration,
      timezone: args.timezone,
      status: "pending",
      notes: args.notes,
      location: meetingType.location,
      locationDetails: meetingType.locationDetails,
      bookedAt: now,
      updatedAt: now,
    });

    return bookingId;
  },
});

/**
 * Confirm a booking
 */
export const confirmBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    meetingLink: v.optional(v.string()),
    hostNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status !== "pending") {
      throw new Error("Booking is not in pending status");
    }

    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      meetingLink: args.meetingLink,
      hostNotes: args.hostNotes,
      updatedAt: Date.now(),
    });

    return args.bookingId;
  },
});

/**
 * Cancel a booking
 */
export const cancelBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    cancelledBy: v.union(v.literal("host"), v.literal("booker")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new Error("Booking cannot be cancelled");
    }

    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      cancelledAt: Date.now(),
      cancelledBy: args.cancelledBy,
      cancellationReason: args.reason,
      updatedAt: Date.now(),
    });

    return args.bookingId;
  },
});

/**
 * Reschedule a booking
 */
export const rescheduleBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    newScheduledAt: v.number(),
    rescheduledBy: v.union(v.literal("host"), v.literal("booker")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new Error("Booking cannot be rescheduled");
    }

    const meetingType = await ctx.db.get(booking.meetingTypeId);
    if (!meetingType) {
      throw new Error("Meeting type not found");
    }

    // Validate new time slot
    const minNoticeMs = (meetingType.minNotice ?? 24) * 60 * 60 * 1000;
    if (args.newScheduledAt < now + minNoticeMs) {
      throw new Error("New time slot does not meet minimum notice requirement");
    }

    // Cancel the old booking
    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      cancelledAt: now,
      cancelledBy: args.rescheduledBy,
      cancellationReason: "Rescheduled",
      updatedAt: now,
    });

    // Create new booking
    const newBookingId = await ctx.db.insert("bookings", {
      meetingTypeId: booking.meetingTypeId,
      contactId: booking.contactId,
      bookerName: booking.bookerName,
      bookerEmail: booking.bookerEmail,
      bookerPhone: booking.bookerPhone,
      scheduledAt: args.newScheduledAt,
      duration: booking.duration,
      timezone: booking.timezone,
      status: "confirmed",
      notes: booking.notes,
      location: booking.location,
      locationDetails: booking.locationDetails,
      rescheduledFrom: args.bookingId,
      bookedAt: now,
      updatedAt: now,
    });

    return newBookingId;
  },
});

/**
 * Mark booking as completed
 */
export const completeBooking = mutation({
  args: {
    bookingId: v.id("bookings"),
    outcome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await ctx.db.patch(args.bookingId, {
      status: "completed",
      hostNotes: args.outcome || booking.hostNotes,
      updatedAt: Date.now(),
    });

    return args.bookingId;
  },
});

/**
 * Mark booking as no-show
 */
export const markNoShow = mutation({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await ctx.db.patch(args.bookingId, {
      status: "noShow",
      updatedAt: Date.now(),
    });

    return args.bookingId;
  },
});

// =============================================================================
// BOOKING QUERIES
// =============================================================================

/**
 * Get bookings for a user
 */
export const getMyBookings = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("cancelled"),
        v.literal("completed"),
        v.literal("noShow")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get meeting types created by this user
    const meetingTypes = await ctx.db
      .query("meetingTypes")
      .withIndex("by_created_by", (q) => q.eq("createdBy", args.userId))
      .collect();

    const meetingTypeIds = meetingTypes.map((mt) => mt._id);

    if (meetingTypeIds.length === 0) {
      return [];
    }

    // Get bookings for these meeting types
    let bookings: Doc<"bookings">[] = [];
    for (const mtId of meetingTypeIds) {
      let query = ctx.db
        .query("bookings")
        .withIndex("by_meeting_type", (q) => q.eq("meetingTypeId", mtId));

      const mtBookings = await query.collect();
      bookings = bookings.concat(mtBookings);
    }

    // Filter by status if specified
    if (args.status) {
      bookings = bookings.filter((b) => b.status === args.status);
    }

    // Filter by date range if specified
    if (args.startDate) {
      bookings = bookings.filter((b) => b.scheduledAt >= args.startDate!);
    }
    if (args.endDate) {
      bookings = bookings.filter((b) => b.scheduledAt <= args.endDate!);
    }

    // Sort by scheduled time
    bookings.sort((a, b) => a.scheduledAt - b.scheduledAt);

    // Enrich with meeting type info
    return Promise.all(
      bookings.map(async (booking) => {
        const meetingType = await ctx.db.get(booking.meetingTypeId);
        const contact = booking.contactId ? await ctx.db.get(booking.contactId) : null;

        return {
          ...booking,
          meetingType: meetingType
            ? {
                name: meetingType.name,
                color: meetingType.color,
                duration: meetingType.duration,
              }
            : null,
          contact: contact
            ? {
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
              }
            : null,
        };
      })
    );
  },
});

/**
 * Get upcoming bookings
 */
export const getUpcomingBookings = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const now = Date.now();

    // Get meeting types created by this user
    const meetingTypes = await ctx.db
      .query("meetingTypes")
      .withIndex("by_created_by", (q) => q.eq("createdBy", args.userId))
      .collect();

    const meetingTypeIds = meetingTypes.map((mt) => mt._id);

    if (meetingTypeIds.length === 0) {
      return [];
    }

    // Get upcoming bookings
    let allBookings: Doc<"bookings">[] = [];
    for (const mtId of meetingTypeIds) {
      const mtBookings = await ctx.db
        .query("bookings")
        .withIndex("by_meeting_type", (q) => q.eq("meetingTypeId", mtId))
        .filter((q) =>
          q.and(
            q.gte(q.field("scheduledAt"), now),
            q.or(
              q.eq(q.field("status"), "pending"),
              q.eq(q.field("status"), "confirmed")
            )
          )
        )
        .collect();
      allBookings = allBookings.concat(mtBookings);
    }

    // Sort and limit
    allBookings.sort((a, b) => a.scheduledAt - b.scheduledAt);
    const bookings = allBookings.slice(0, limit);

    // Enrich with meeting type info
    return Promise.all(
      bookings.map(async (booking) => {
        const meetingType = await ctx.db.get(booking.meetingTypeId);

        return {
          ...booking,
          meetingType: meetingType
            ? {
                name: meetingType.name,
                color: meetingType.color,
              }
            : null,
        };
      })
    );
  },
});

/**
 * Get a single booking
 */
export const getBooking = query({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return null;
    }

    const meetingType = await ctx.db.get(booking.meetingTypeId);
    const contact = booking.contactId ? await ctx.db.get(booking.contactId) : null;

    let creator = null;
    if (meetingType?.createdBy) {
      creator = await ctx.db.get(meetingType.createdBy);
    }

    return {
      ...booking,
      meetingType: meetingType
        ? {
            name: meetingType.name,
            description: meetingType.description,
            color: meetingType.color,
            duration: meetingType.duration,
            location: meetingType.location,
            locationDetails: meetingType.locationDetails,
          }
        : null,
      contact,
      host: creator
        ? {
            firstName: creator.firstName,
            lastName: creator.lastName,
            email: creator.email,
            avatarUrl: creator.avatarUrl,
          }
        : null,
    };
  },
});

/**
 * Get bookings for a contact
 */
export const getBookingsByContact = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    return Promise.all(
      bookings.map(async (booking) => {
        const meetingType = await ctx.db.get(booking.meetingTypeId);
        return {
          ...booking,
          meetingType: meetingType
            ? {
                name: meetingType.name,
                color: meetingType.color,
              }
            : null,
        };
      })
    );
  },
});

// =============================================================================
// INTERNAL MUTATIONS
// =============================================================================

/**
 * Mark confirmation as sent
 */
export const markConfirmationSent = internalMutation({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      confirmationSent: true,
      confirmationSentAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark reminder as sent
 */
export const markReminderSent = internalMutation({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      reminderSent: true,
      reminderSentAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// =============================================================================
// ACTIONS (For external API calls like sending emails)
// =============================================================================

/**
 * Send confirmation email
 */
export const sendConfirmationEmail = action({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    // Get booking details
    const booking = await ctx.runQuery(internal.scheduler.getBookingInternal, {
      bookingId: args.bookingId,
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // In a real implementation, you would send an email here
    // For now, we'll just mark the confirmation as sent
    console.log(`Sending confirmation email to ${booking.bookerEmail}`);

    await ctx.runMutation(internal.scheduler.markConfirmationSent, {
      bookingId: args.bookingId,
    });

    return { success: true };
  },
});

/**
 * Send reminder email
 */
export const sendReminderEmail = action({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.runQuery(internal.scheduler.getBookingInternal, {
      bookingId: args.bookingId,
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // In a real implementation, you would send an email here
    console.log(`Sending reminder email to ${booking.bookerEmail}`);

    await ctx.runMutation(internal.scheduler.markReminderSent, {
      bookingId: args.bookingId,
    });

    return { success: true };
  },
});

// Internal query for actions
export const getBookingInternal = internalQuery({
  args: {
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.bookingId);
  },
});
