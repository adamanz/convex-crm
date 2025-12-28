import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// FIELD PERMISSIONS - Query and Mutation Functions
// ============================================================================

/**
 * Role hierarchy and defaults
 * Admin > Manager > Member
 * By default, if no permission is set, roles inherit from above
 */

export const ENTITY_TYPES = ["contact", "company", "deal"] as const;
export const ROLES = ["admin", "manager", "member"] as const;
export const PERMISSIONS = ["read", "write", "hidden"] as const;

// Standard fields for each entity type
export const STANDARD_FIELDS = {
  contact: [
    { name: "firstName", label: "First Name", required: false },
    { name: "lastName", label: "Last Name", required: true },
    { name: "email", label: "Email", required: false },
    { name: "phone", label: "Phone", required: false },
    { name: "avatarUrl", label: "Avatar", required: false },
    { name: "companyId", label: "Company", required: false },
    { name: "title", label: "Title", required: false },
    { name: "address", label: "Address", required: false },
    { name: "linkedinUrl", label: "LinkedIn", required: false },
    { name: "twitterHandle", label: "Twitter", required: false },
    { name: "source", label: "Source", required: false },
    { name: "ownerId", label: "Owner", required: false },
    { name: "tags", label: "Tags", required: false },
    { name: "aiScore", label: "AI Score", required: false },
    { name: "enrichmentData", label: "Enrichment Data", required: false },
  ],
  company: [
    { name: "name", label: "Name", required: true },
    { name: "domain", label: "Domain", required: false },
    { name: "logoUrl", label: "Logo", required: false },
    { name: "industry", label: "Industry", required: false },
    { name: "size", label: "Size", required: false },
    { name: "annualRevenue", label: "Annual Revenue", required: false },
    { name: "description", label: "Description", required: false },
    { name: "address", label: "Address", required: false },
    { name: "phone", label: "Phone", required: false },
    { name: "website", label: "Website", required: false },
    { name: "ownerId", label: "Owner", required: false },
    { name: "tags", label: "Tags", required: false },
    { name: "enrichmentData", label: "Enrichment Data", required: false },
  ],
  deal: [
    { name: "name", label: "Name", required: true },
    { name: "companyId", label: "Company", required: false },
    { name: "contactIds", label: "Contacts", required: false },
    { name: "pipelineId", label: "Pipeline", required: true },
    { name: "stageId", label: "Stage", required: true },
    { name: "amount", label: "Amount", required: false },
    { name: "currency", label: "Currency", required: false },
    { name: "probability", label: "Probability", required: false },
    { name: "expectedCloseDate", label: "Expected Close Date", required: false },
    { name: "actualCloseDate", label: "Actual Close Date", required: false },
    { name: "status", label: "Status", required: false },
    { name: "lostReason", label: "Lost Reason", required: false },
    { name: "ownerId", label: "Owner", required: false },
    { name: "tags", label: "Tags", required: false },
    { name: "aiInsights", label: "AI Insights", required: false },
    { name: "winProbability", label: "Win Probability", required: false },
  ],
} as const;

// ============================================================================
// PERMISSION QUERIES
// ============================================================================

/**
 * List all permissions with optional filtering
 */
export const listPermissions = query({
  args: {
    entityType: v.optional(
      v.union(v.literal("contact"), v.literal("company"), v.literal("deal"))
    ),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("manager"), v.literal("member"))
    ),
  },
  handler: async (ctx, args) => {
    let permissions;

    if (args.entityType && args.role) {
      permissions = await ctx.db
        .query("fieldPermissions")
        .withIndex("by_entity_role", (q) =>
          q.eq("entityType", args.entityType!).eq("role", args.role!)
        )
        .collect();
    } else if (args.entityType) {
      permissions = await ctx.db
        .query("fieldPermissions")
        .withIndex("by_entity_role", (q) => q.eq("entityType", args.entityType!))
        .collect();
    } else {
      permissions = await ctx.db.query("fieldPermissions").collect();
    }

    // Filter by role if specified but no entityType
    if (args.role && !args.entityType) {
      permissions = permissions.filter((p) => p.role === args.role);
    }

    return permissions;
  },
});

/**
 * Get permissions for a specific role
 */
export const getPermissionsByRole = query({
  args: {
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("member")),
    entityType: v.optional(
      v.union(v.literal("contact"), v.literal("company"), v.literal("deal"))
    ),
  },
  handler: async (ctx, args) => {
    let permissions;

    if (args.entityType) {
      permissions = await ctx.db
        .query("fieldPermissions")
        .withIndex("by_entity_role", (q) =>
          q.eq("entityType", args.entityType!).eq("role", args.role)
        )
        .collect();
    } else {
      permissions = await ctx.db
        .query("fieldPermissions")
        .filter((q) => q.eq(q.field("role"), args.role))
        .collect();
    }

    // Group by entity type for easier consumption
    const byEntityType: Record<string, Doc<"fieldPermissions">[]> = {
      contact: [],
      company: [],
      deal: [],
    };

    for (const perm of permissions) {
      byEntityType[perm.entityType].push(perm);
    }

    return byEntityType;
  },
});

/**
 * Get visible/editable fields for a role
 */
export const getFieldsForRole = query({
  args: {
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("member")),
    entityType: v.union(v.literal("contact"), v.literal("company"), v.literal("deal")),
  },
  handler: async (ctx, args) => {
    const { role, entityType } = args;

    // Get all permissions for this entity type and role
    const permissions = await ctx.db
      .query("fieldPermissions")
      .withIndex("by_entity_role", (q) =>
        q.eq("entityType", entityType).eq("role", role)
      )
      .collect();

    // Create a map of field -> permission
    const permissionMap = new Map<string, string>();
    for (const perm of permissions) {
      permissionMap.set(perm.field, perm.permission);
    }

    // Get standard fields for this entity type
    const standardFields = STANDARD_FIELDS[entityType];

    // Also get custom fields
    const customFields = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_entity", (q) => q.eq("entityType", entityType))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Determine visibility and editability for each field
    const visibleFields: string[] = [];
    const editableFields: string[] = [];
    const hiddenFields: string[] = [];

    // Process standard fields
    for (const field of standardFields) {
      const permission = permissionMap.get(field.name);

      // Default: admin has write, manager has write, member has read
      // Unless explicitly set otherwise
      if (permission === "hidden") {
        hiddenFields.push(field.name);
      } else if (permission === "read") {
        visibleFields.push(field.name);
      } else if (permission === "write") {
        visibleFields.push(field.name);
        editableFields.push(field.name);
      } else {
        // No permission set - use default based on role
        if (role === "admin") {
          visibleFields.push(field.name);
          editableFields.push(field.name);
        } else if (role === "manager") {
          visibleFields.push(field.name);
          editableFields.push(field.name);
        } else {
          // member - default to read
          visibleFields.push(field.name);
        }
      }
    }

    // Process custom fields
    for (const customField of customFields) {
      const fieldId = `custom_${customField._id}`;
      const permission = permissionMap.get(fieldId);

      if (permission === "hidden") {
        hiddenFields.push(fieldId);
      } else if (permission === "read") {
        visibleFields.push(fieldId);
      } else if (permission === "write") {
        visibleFields.push(fieldId);
        editableFields.push(fieldId);
      } else {
        // Default based on role
        if (role === "admin" || role === "manager") {
          visibleFields.push(fieldId);
          editableFields.push(fieldId);
        } else {
          visibleFields.push(fieldId);
        }
      }
    }

    return {
      visibleFields,
      editableFields,
      hiddenFields,
      allFields: [...standardFields.map((f) => f.name), ...customFields.map((f) => `custom_${f._id}`)],
    };
  },
});

/**
 * Check if a user can access a specific field
 */
export const checkFieldAccess = query({
  args: {
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("member")),
    entityType: v.union(v.literal("contact"), v.literal("company"), v.literal("deal")),
    field: v.string(),
    accessType: v.union(v.literal("read"), v.literal("write")),
  },
  handler: async (ctx, args) => {
    const { role, entityType, field, accessType } = args;

    // Get the permission for this specific field
    const permission = await ctx.db
      .query("fieldPermissions")
      .withIndex("by_entity_field_role", (q) =>
        q.eq("entityType", entityType).eq("field", field).eq("role", role)
      )
      .first();

    if (!permission) {
      // No explicit permission - use default based on role
      if (role === "admin") {
        return { allowed: true, permission: "write" };
      } else if (role === "manager") {
        return { allowed: true, permission: "write" };
      } else {
        // member - default to read only
        return { allowed: accessType === "read", permission: "read" };
      }
    }

    if (permission.permission === "hidden") {
      return { allowed: false, permission: "hidden" };
    }

    if (permission.permission === "read") {
      return { allowed: accessType === "read", permission: "read" };
    }

    // write permission
    return { allowed: true, permission: "write" };
  },
});

/**
 * Get the permission matrix - grid of role x field permissions
 */
export const getPermissionMatrix = query({
  args: {
    entityType: v.union(v.literal("contact"), v.literal("company"), v.literal("deal")),
  },
  handler: async (ctx, args) => {
    const { entityType } = args;

    // Get all permissions for this entity type
    const permissions = await ctx.db
      .query("fieldPermissions")
      .withIndex("by_entity_role", (q) => q.eq("entityType", entityType))
      .collect();

    // Get standard fields
    const standardFields = STANDARD_FIELDS[entityType];

    // Get custom fields
    const customFields = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_entity", (q) => q.eq("entityType", entityType))
      .collect();

    // Build permission map: field -> role -> permission
    const permissionMap: Record<string, Record<string, string>> = {};

    for (const perm of permissions) {
      if (!permissionMap[perm.field]) {
        permissionMap[perm.field] = {};
      }
      permissionMap[perm.field][perm.role] = perm.permission;
    }

    // Build the matrix
    const matrix: Array<{
      field: string;
      label: string;
      isCustom: boolean;
      required: boolean;
      admin: string;
      manager: string;
      member: string;
    }> = [];

    // Add standard fields
    for (const field of standardFields) {
      const fieldPerms = permissionMap[field.name] || {};
      matrix.push({
        field: field.name,
        label: field.label,
        isCustom: false,
        required: field.required,
        admin: fieldPerms.admin || "write",
        manager: fieldPerms.manager || "write",
        member: fieldPerms.member || "read",
      });
    }

    // Add custom fields
    for (const customField of customFields) {
      const fieldId = `custom_${customField._id}`;
      const fieldPerms = permissionMap[fieldId] || {};
      matrix.push({
        field: fieldId,
        label: customField.label,
        isCustom: true,
        required: customField.isRequired,
        admin: fieldPerms.admin || "write",
        manager: fieldPerms.manager || "write",
        member: fieldPerms.member || "read",
      });
    }

    return matrix;
  },
});

/**
 * Get available fields for an entity type (for UI)
 */
export const getAvailableFields = query({
  args: {
    entityType: v.union(v.literal("contact"), v.literal("company"), v.literal("deal")),
  },
  handler: async (ctx, args) => {
    const { entityType } = args;

    const standardFields = STANDARD_FIELDS[entityType].map((f) => ({
      ...f,
      isCustom: false,
      fieldId: f.name,
    }));

    const customFields = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_entity", (q) => q.eq("entityType", entityType))
      .collect();

    const customFieldsMapped = customFields.map((f) => ({
      name: `custom_${f._id}`,
      label: f.label,
      required: f.isRequired,
      isCustom: true,
      fieldId: `custom_${f._id}`,
    }));

    return [...standardFields, ...customFieldsMapped];
  },
});

// ============================================================================
// PERMISSION MUTATIONS
// ============================================================================

/**
 * Set a permission for a field/role combination
 */
export const setPermission = mutation({
  args: {
    entityType: v.union(v.literal("contact"), v.literal("company"), v.literal("deal")),
    field: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("member")),
    permission: v.union(v.literal("read"), v.literal("write"), v.literal("hidden")),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { entityType, field, role, permission, createdBy } = args;

    // Check if permission already exists
    const existing = await ctx.db
      .query("fieldPermissions")
      .withIndex("by_entity_field_role", (q) =>
        q.eq("entityType", entityType).eq("field", field).eq("role", role)
      )
      .first();

    if (existing) {
      // Update existing permission
      await ctx.db.patch(existing._id, {
        permission,
        updatedAt: now,
      });

      // Log the activity
      await ctx.db.insert("activityLog", {
        action: "permission_updated",
        entityType: "fieldPermission",
        entityId: existing._id,
        changes: {
          field,
          role,
          permission,
          previousPermission: existing.permission,
        },
        userId: createdBy,
        timestamp: now,
      });

      return existing._id;
    } else {
      // Create new permission
      const permissionId = await ctx.db.insert("fieldPermissions", {
        entityType,
        field,
        role,
        permission,
        createdBy,
        createdAt: now,
        updatedAt: now,
      });

      // Log the activity
      await ctx.db.insert("activityLog", {
        action: "permission_created",
        entityType: "fieldPermission",
        entityId: permissionId,
        metadata: {
          entityType,
          field,
          role,
          permission,
        },
        userId: createdBy,
        timestamp: now,
      });

      return permissionId;
    }
  },
});

/**
 * Set multiple permissions at once (for bulk updates)
 */
export const setPermissions = mutation({
  args: {
    permissions: v.array(
      v.object({
        entityType: v.union(v.literal("contact"), v.literal("company"), v.literal("deal")),
        field: v.string(),
        role: v.union(v.literal("admin"), v.literal("manager"), v.literal("member")),
        permission: v.union(v.literal("read"), v.literal("write"), v.literal("hidden")),
      })
    ),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { permissions, createdBy } = args;
    const results: Id<"fieldPermissions">[] = [];

    for (const perm of permissions) {
      const { entityType, field, role, permission } = perm;

      // Check if permission already exists
      const existing = await ctx.db
        .query("fieldPermissions")
        .withIndex("by_entity_field_role", (q) =>
          q.eq("entityType", entityType).eq("field", field).eq("role", role)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          permission,
          updatedAt: now,
        });
        results.push(existing._id);
      } else {
        const permissionId = await ctx.db.insert("fieldPermissions", {
          entityType,
          field,
          role,
          permission,
          createdBy,
          createdAt: now,
          updatedAt: now,
        });
        results.push(permissionId);
      }
    }

    // Log bulk update
    await ctx.db.insert("activityLog", {
      action: "permissions_bulk_updated",
      entityType: "fieldPermission",
      entityId: "bulk",
      metadata: {
        count: permissions.length,
      },
      userId: createdBy,
      timestamp: now,
    });

    return results;
  },
});

/**
 * Delete a permission (revert to default behavior)
 */
export const deletePermission = mutation({
  args: {
    id: v.id("fieldPermissions"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const permission = await ctx.db.get(args.id);
    if (!permission) {
      throw new Error("Permission not found");
    }

    // Log before deletion
    await ctx.db.insert("activityLog", {
      action: "permission_deleted",
      entityType: "fieldPermission",
      entityId: args.id,
      metadata: {
        entityType: permission.entityType,
        field: permission.field,
        role: permission.role,
        permission: permission.permission,
      },
      timestamp: now,
      system: true,
    });

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Delete permission by field, role, and entity type
 */
export const deletePermissionByKey = mutation({
  args: {
    entityType: v.union(v.literal("contact"), v.literal("company"), v.literal("deal")),
    field: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const { entityType, field, role } = args;

    const permission = await ctx.db
      .query("fieldPermissions")
      .withIndex("by_entity_field_role", (q) =>
        q.eq("entityType", entityType).eq("field", field).eq("role", role)
      )
      .first();

    if (!permission) {
      return { success: false, message: "Permission not found" };
    }

    await ctx.db.delete(permission._id);

    return { success: true };
  },
});

/**
 * Reset all permissions for an entity type (delete all custom permissions)
 */
export const resetPermissions = mutation({
  args: {
    entityType: v.union(v.literal("contact"), v.literal("company"), v.literal("deal")),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { entityType, createdBy } = args;

    const permissions = await ctx.db
      .query("fieldPermissions")
      .withIndex("by_entity_role", (q) => q.eq("entityType", entityType))
      .collect();

    for (const perm of permissions) {
      await ctx.db.delete(perm._id);
    }

    // Log the reset
    await ctx.db.insert("activityLog", {
      action: "permissions_reset",
      entityType: "fieldPermission",
      entityId: entityType,
      metadata: {
        deletedCount: permissions.length,
      },
      userId: createdBy,
      timestamp: now,
    });

    return { success: true, deletedCount: permissions.length };
  },
});

// ============================================================================
// HELPER FUNCTIONS FOR QUERY-LEVEL SECURITY
// ============================================================================

/**
 * Apply field mask to an entity based on role permissions
 * This should be called in queries to filter out hidden fields
 */
export const applyFieldMask = query({
  args: {
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("member")),
    entityType: v.union(v.literal("contact"), v.literal("company"), v.literal("deal")),
    entity: v.any(),
  },
  handler: async (ctx, args) => {
    const { role, entityType, entity } = args;

    if (!entity) return null;

    // Get permissions for this role and entity type
    const permissions = await ctx.db
      .query("fieldPermissions")
      .withIndex("by_entity_role", (q) =>
        q.eq("entityType", entityType).eq("role", role)
      )
      .collect();

    // Create a set of hidden fields
    const hiddenFields = new Set<string>();
    for (const perm of permissions) {
      if (perm.permission === "hidden") {
        hiddenFields.add(perm.field);
      }
    }

    // For members, if no explicit permission, some sensitive fields might be hidden
    // This is just the filtering logic - actual defaults are set elsewhere

    // Filter out hidden fields
    const maskedEntity = { ...entity };
    for (const field of hiddenFields) {
      if (field in maskedEntity) {
        delete maskedEntity[field];
      }
    }

    return maskedEntity;
  },
});

/**
 * Get editable fields for form rendering
 * Returns fields with their editability status
 */
export const getFormFields = query({
  args: {
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("member")),
    entityType: v.union(v.literal("contact"), v.literal("company"), v.literal("deal")),
  },
  handler: async (ctx, args) => {
    const { role, entityType } = args;

    // Get all permissions for this role and entity type
    const permissions = await ctx.db
      .query("fieldPermissions")
      .withIndex("by_entity_role", (q) =>
        q.eq("entityType", entityType).eq("role", role)
      )
      .collect();

    const permissionMap = new Map<string, string>();
    for (const perm of permissions) {
      permissionMap.set(perm.field, perm.permission);
    }

    // Get standard fields
    const standardFields = STANDARD_FIELDS[entityType];

    // Get custom fields
    const customFields = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_entity", (q) => q.eq("entityType", entityType))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Build form fields array
    const formFields: Array<{
      field: string;
      label: string;
      isCustom: boolean;
      required: boolean;
      visible: boolean;
      editable: boolean;
      customFieldDef?: Doc<"customFieldDefinitions">;
    }> = [];

    // Process standard fields
    for (const field of standardFields) {
      const permission = permissionMap.get(field.name);
      let visible = true;
      let editable = role !== "member"; // Default: admin/manager can edit, member read-only

      if (permission === "hidden") {
        visible = false;
        editable = false;
      } else if (permission === "read") {
        editable = false;
      } else if (permission === "write") {
        editable = true;
      }

      formFields.push({
        field: field.name,
        label: field.label,
        isCustom: false,
        required: field.required,
        visible,
        editable,
      });
    }

    // Process custom fields
    for (const customField of customFields) {
      const fieldId = `custom_${customField._id}`;
      const permission = permissionMap.get(fieldId);
      let visible = true;
      let editable = role !== "member";

      if (permission === "hidden") {
        visible = false;
        editable = false;
      } else if (permission === "read") {
        editable = false;
      } else if (permission === "write") {
        editable = true;
      }

      formFields.push({
        field: fieldId,
        label: customField.label,
        isCustom: true,
        required: customField.isRequired,
        visible,
        editable,
        customFieldDef: customField,
      });
    }

    return formFields;
  },
});
