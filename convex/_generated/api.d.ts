/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as ai from "../ai.js";
import type * as api_ from "../api.js";
import type * as approvals from "../approvals.js";
import type * as auditLog from "../auditLog.js";
import type * as bulk from "../bulk.js";
import type * as calendar from "../calendar.js";
import type * as callRecordings from "../callRecordings.js";
import type * as campaigns from "../campaigns.js";
import type * as comments from "../comments.js";
import type * as companies from "../companies.js";
import type * as contacts from "../contacts.js";
import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as customFields from "../customFields.js";
import type * as dashboard from "../dashboard.js";
import type * as dashboards from "../dashboards.js";
import type * as deals from "../deals.js";
import type * as documents from "../documents.js";
import type * as duplicates from "../duplicates.js";
import type * as email from "../email.js";
import type * as export_ from "../export.js";
import type * as forecasting from "../forecasting.js";
import type * as goals from "../goals.js";
import type * as help from "../help.js";
import type * as http from "../http.js";
import type * as import_ from "../import.js";
import type * as integrations from "../integrations.js";
import type * as leaderboards from "../leaderboards.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as parallel from "../parallel.js";
import type * as permissions from "../permissions.js";
import type * as pipelines from "../pipelines.js";
import type * as products from "../products.js";
import type * as retention from "../retention.js";
import type * as retentionCron from "../retentionCron.js";
import type * as scheduler from "../scheduler.js";
import type * as seed from "../seed.js";
import type * as sendblue from "../sendblue.js";
import type * as sequences from "../sequences.js";
import type * as smartLists from "../smartLists.js";
import type * as tags from "../tags.js";
import type * as users from "../users.js";
import type * as validation from "../validation.js";
import type * as webForms from "../webForms.js";
import type * as webhooks from "../webhooks.js";
import type * as workflowEngine from "../workflowEngine.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  ai: typeof ai;
  api: typeof api_;
  approvals: typeof approvals;
  auditLog: typeof auditLog;
  bulk: typeof bulk;
  calendar: typeof calendar;
  callRecordings: typeof callRecordings;
  campaigns: typeof campaigns;
  comments: typeof comments;
  companies: typeof companies;
  contacts: typeof contacts;
  conversations: typeof conversations;
  crons: typeof crons;
  customFields: typeof customFields;
  dashboard: typeof dashboard;
  dashboards: typeof dashboards;
  deals: typeof deals;
  documents: typeof documents;
  duplicates: typeof duplicates;
  email: typeof email;
  export: typeof export_;
  forecasting: typeof forecasting;
  goals: typeof goals;
  help: typeof help;
  http: typeof http;
  import: typeof import_;
  integrations: typeof integrations;
  leaderboards: typeof leaderboards;
  messages: typeof messages;
  notifications: typeof notifications;
  parallel: typeof parallel;
  permissions: typeof permissions;
  pipelines: typeof pipelines;
  products: typeof products;
  retention: typeof retention;
  retentionCron: typeof retentionCron;
  scheduler: typeof scheduler;
  seed: typeof seed;
  sendblue: typeof sendblue;
  sequences: typeof sequences;
  smartLists: typeof smartLists;
  tags: typeof tags;
  users: typeof users;
  validation: typeof validation;
  webForms: typeof webForms;
  webhooks: typeof webhooks;
  workflowEngine: typeof workflowEngine;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
