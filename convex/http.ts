import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Helper to hash API key
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper for CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
  "Access-Control-Max-Age": "86400",
};

const http = httpRouter();

// =============================================================================
// SENDBLUE WEBHOOKS
// =============================================================================

/**
 * Webhook endpoint for incoming Sendblue messages
 * Configure this URL in your Sendblue dashboard:
 * https://<your-deployment>.convex.site/webhooks/sendblue/receive
 */
http.route({
  path: "/webhooks/sendblue/receive",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // Log webhook payload for debugging
      console.log("Sendblue webhook received:", JSON.stringify(body, null, 2));

      // Validate required fields
      if (!body.number && !body.to_number) {
        return new Response(
          JSON.stringify({ error: "Missing phone number" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Determine if this is an inbound message or a status update
      const isInbound = body.type === "INBOUND" || body.is_outbound === false;
      const isStatusUpdate = body.type === "STATUS_UPDATE" || body.status !== undefined;

      if (isInbound) {
        // Handle incoming message
        const phoneNumber = body.number || body.from_number;
        const sendblueNumber = body.to_number || body.sendblue_number || "";
        const content = body.content || body.text || body.body || "";
        const mediaUrl = body.media_url || body.media?.[0]?.url;
        const messageHandle = body.message_handle;
        const service = body.was_downgraded === true ? "SMS" : "iMessage";

        if (!content && !mediaUrl) {
          return new Response(
            JSON.stringify({ error: "Missing message content" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Find or create conversation
        const conversationId = await ctx.runMutation(
          internal.sendblue.findOrCreateConversation,
          {
            phoneNumber,
            sendblueNumber,
            isIMessage: service === "iMessage",
          }
        );

        // Create the inbound message
        await ctx.runMutation(internal.sendblue.createInboundMessage, {
          conversationId,
          content: content || "[Media]",
          mediaUrl,
          messageHandle,
          service,
        });

        return new Response(
          JSON.stringify({ success: true, conversationId }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (isStatusUpdate) {
        // Handle delivery status update
        const messageHandle = body.message_handle;
        if (!messageHandle) {
          return new Response(
            JSON.stringify({ error: "Missing message_handle for status update" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Map Sendblue status to our status
        let status: "pending" | "sent" | "delivered" | "read" | "failed" = "pending";
        const sendblueStatus = (body.status || "").toUpperCase();

        switch (sendblueStatus) {
          case "QUEUED":
          case "SENT":
            status = "sent";
            break;
          case "DELIVERED":
            status = "delivered";
            break;
          case "READ":
            status = "read";
            break;
          case "FAILED":
          case "ERROR":
          case "UNDELIVERED":
            status = "failed";
            break;
          default:
            status = "sent";
        }

        const errorMessage = body.error_message || body.error_code
          ? `${body.error_code || ""}: ${body.error_message || "Unknown error"}`
          : undefined;

        await ctx.runMutation(internal.sendblue.updateMessageStatusFromWebhook, {
          messageHandle,
          status,
          errorMessage,
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Unknown webhook type - still return 200 to acknowledge receipt
      console.warn("Unknown Sendblue webhook type:", body.type || body);
      return new Response(
        JSON.stringify({ success: true, message: "Webhook received but not processed" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Sendblue webhook error:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * Webhook endpoint for Sendblue delivery receipts (alternate path)
 * Some Sendblue configurations send to a separate delivery endpoint
 */
http.route({
  path: "/webhooks/sendblue/delivery",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      console.log("Sendblue delivery webhook received:", JSON.stringify(body, null, 2));

      const messageHandle = body.message_handle;
      if (!messageHandle) {
        return new Response(
          JSON.stringify({ error: "Missing message_handle" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Map Sendblue status to our status
      let status: "pending" | "sent" | "delivered" | "read" | "failed" = "delivered";
      const sendblueStatus = (body.status || "DELIVERED").toUpperCase();

      switch (sendblueStatus) {
        case "DELIVERED":
          status = "delivered";
          break;
        case "READ":
          status = "read";
          break;
        case "FAILED":
        case "ERROR":
        case "UNDELIVERED":
          status = "failed";
          break;
        default:
          status = "delivered";
      }

      const errorMessage = body.error_message || body.error_code
        ? `${body.error_code || ""}: ${body.error_message || "Unknown error"}`
        : undefined;

      await ctx.runMutation(internal.sendblue.updateMessageStatusFromWebhook, {
        messageHandle,
        status,
        errorMessage,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Sendblue delivery webhook error:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * Health check endpoint for webhooks
 */
http.route({
  path: "/webhooks/sendblue/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({ status: "ok", timestamp: Date.now() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// =============================================================================
// GOOGLE CALENDAR OAUTH
// =============================================================================

/**
 * OAuth callback endpoint for Google Calendar
 * Configure this URL in your Google Cloud Console:
 * https://<your-deployment>.convex.site/oauth/google/callback
 */
http.route({
  path: "/oauth/google/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      // Handle OAuth error
      if (error) {
        console.error("Google OAuth error:", error);
        const errorDescription = url.searchParams.get("error_description") || error;
        return new Response(
          `<html>
            <head><title>Calendar Connection Failed</title></head>
            <body>
              <h1>Connection Failed</h1>
              <p>Error: ${errorDescription}</p>
              <p><a href="/">Return to app</a></p>
              <script>
                setTimeout(() => {
                  window.opener?.postMessage({ type: 'GOOGLE_OAUTH_ERROR', error: '${errorDescription}' }, '*');
                  window.close();
                }, 2000);
              </script>
            </body>
          </html>`,
          {
            status: 200,
            headers: { "Content-Type": "text/html" },
          }
        );
      }

      // Validate required parameters
      if (!code || !state) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Decode state to get userId
      let userId: string;
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64").toString());
        userId = stateData.userId;
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid state parameter" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Get OAuth credentials from environment
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${url.origin}/oauth/google/callback`;

      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({ error: "Google OAuth not configured" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("Token exchange failed:", errorData);
        return new Response(
          `<html>
            <head><title>Calendar Connection Failed</title></head>
            <body>
              <h1>Connection Failed</h1>
              <p>Failed to exchange authorization code for tokens.</p>
              <p><a href="/">Return to app</a></p>
              <script>
                setTimeout(() => {
                  window.opener?.postMessage({ type: 'GOOGLE_OAUTH_ERROR', error: 'Token exchange failed' }, '*');
                  window.close();
                }, 2000);
              </script>
            </body>
          </html>`,
          {
            status: 200,
            headers: { "Content-Type": "text/html" },
          }
        );
      }

      const tokenData = await tokenResponse.json();
      const { access_token, refresh_token, expires_in } = tokenData;

      // Get user's email from Google
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        console.error("Failed to get user info");
        return new Response(
          JSON.stringify({ error: "Failed to get user info" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const userInfo = await userInfoResponse.json();
      const email = userInfo.email;
      const name = userInfo.name;

      // Get primary calendar ID
      const calendarListResponse = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList/primary",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      let calendarId = "primary";
      if (calendarListResponse.ok) {
        const calendarData = await calendarListResponse.json();
        calendarId = calendarData.id || "primary";
      }

      // Store the connection
      await ctx.runMutation(internal.calendar.storeCalendarConnectionInternal, {
        userId: userId as any, // Type cast - will be validated by mutation
        provider: "google",
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: Date.now() + expires_in * 1000,
        email,
        name,
        calendarId,
      });

      // Return success page that closes the popup
      return new Response(
        `<html>
          <head>
            <title>Calendar Connected</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 40px;
                background: rgba(255,255,255,0.1);
                border-radius: 16px;
                backdrop-filter: blur(10px);
              }
              .checkmark {
                font-size: 64px;
                margin-bottom: 16px;
              }
              h1 { margin: 0 0 8px 0; font-weight: 600; }
              p { margin: 0; opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="checkmark">&#10003;</div>
              <h1>Calendar Connected!</h1>
              <p>Connected as ${email}</p>
              <p style="margin-top: 16px; font-size: 14px;">This window will close automatically...</p>
            </div>
            <script>
              // Notify opener window of success
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_OAUTH_SUCCESS',
                  email: '${email}',
                  name: '${name || ""}'
                }, '*');
              }
              // Close after a short delay
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      return new Response(
        `<html>
          <head><title>Calendar Connection Failed</title></head>
          <body>
            <h1>Connection Failed</h1>
            <p>An unexpected error occurred.</p>
            <p><a href="/">Return to app</a></p>
            <script>
              setTimeout(() => {
                window.opener?.postMessage({ type: 'GOOGLE_OAUTH_ERROR', error: 'Unexpected error' }, '*');
                window.close();
              }, 2000);
            </script>
          </body>
        </html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    }
  }),
});

/**
 * Health check endpoint for OAuth
 */
http.route({
  path: "/oauth/health",
  method: "GET",
  handler: httpAction(async () => {
    const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: Date.now(),
        providers: {
          google: googleConfigured,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// =============================================================================
// WEB FORMS - Public form submission endpoint
// =============================================================================

/**
 * CORS preflight handler for form submissions
 */
http.route({
  path: "/forms/submit",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }),
});

/**
 * Public form submission endpoint
 * Accepts form data and creates a submission
 * URL: https://<your-deployment>.convex.site/forms/submit
 */
http.route({
  path: "/forms/submit",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // Validate required fields
      const { formId, data, source } = body;

      if (!formId) {
        return new Response(
          JSON.stringify({ error: "Missing formId" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (!data || typeof data !== "object") {
        return new Response(
          JSON.stringify({ error: "Missing or invalid data" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Extract client info from request
      const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        undefined;
      const userAgent = request.headers.get("user-agent") || undefined;

      // Create the submission using internal mutation
      const result = await ctx.runMutation(internal.webForms.createSubmissionInternal, {
        formId: formId as Id<"webForms">,
        data,
        ipAddress,
        userAgent,
        source,
      });

      return new Response(
        JSON.stringify({
          success: true,
          submissionId: result.submissionId,
          successMessage: result.successMessage,
          redirectUrl: result.redirectUrl,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (error) {
      console.error("Form submission error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Submission failed",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  }),
});

/**
 * Health check endpoint for form submissions
 */
http.route({
  path: "/forms/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: Date.now(),
        endpoint: "/forms/submit",
        method: "POST",
        requiredFields: ["formId", "data"],
        optionalFields: ["source"],
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }),
});

// =============================================================================
// OUTBOUND WEBHOOKS - Health check and documentation
// =============================================================================

/**
 * Health check endpoint for outbound webhooks
 */
http.route({
  path: "/webhooks/outbound/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: Date.now(),
        message: "Outbound webhook system is operational",
        documentation: {
          signatureHeader: "X-Webhook-Signature",
          signatureFormat: "sha256={hmac_hex}",
          payloadFormat: {
            id: "delivery_id",
            event: "event_type",
            timestamp: "unix_timestamp_ms",
            data: "event_payload",
          },
          events: [
            "contact.created",
            "contact.updated",
            "contact.deleted",
            "company.created",
            "company.updated",
            "company.deleted",
            "deal.created",
            "deal.updated",
            "deal.stage_changed",
            "deal.won",
            "deal.lost",
            "activity.created",
            "activity.completed",
            "message.received",
            "message.sent",
          ],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// =============================================================================
// PUBLIC REST API - v1
// =============================================================================

// Helper function to validate API key and check rate limits
async function validateApiRequest(
  ctx: any,
  request: Request,
  requiredPermission: string
): Promise<{
  valid: boolean;
  error?: string;
  statusCode?: number;
  apiKeyId?: Id<"apiKeys">;
  rateLimitHeaders?: Record<string, string>;
}> {
  const apiKey = request.headers.get("X-API-Key") || request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return { valid: false, error: "Missing API key. Include X-API-Key header.", statusCode: 401 };
  }

  const keyHash = await hashApiKey(apiKey);

  const validation = await ctx.runQuery(internal.api.validateApiKey, {
    keyHash,
    requiredPermission,
  });

  if (!validation.valid) {
    return { valid: false, error: validation.error, statusCode: 403 };
  }

  const rateLimitCheck = await ctx.runQuery(internal.api.checkRateLimit, {
    apiKeyId: validation.apiKeyId!,
    rateLimit: validation.rateLimit!,
    rateLimitWindow: validation.rateLimitWindow!,
  });

  if (!rateLimitCheck.allowed) {
    return {
      valid: false,
      error: "Rate limit exceeded",
      statusCode: 429,
      rateLimitHeaders: {
        "X-RateLimit-Limit": String(validation.rateLimit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(rateLimitCheck.resetAt / 1000)),
        "Retry-After": String(Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)),
      },
    };
  }

  await ctx.runMutation(internal.api.updateRateLimit, {
    apiKeyId: validation.apiKeyId!,
    rateLimitWindow: validation.rateLimitWindow!,
  });

  return {
    valid: true,
    apiKeyId: validation.apiKeyId,
    rateLimitHeaders: {
      "X-RateLimit-Limit": String(validation.rateLimit),
      "X-RateLimit-Remaining": String(rateLimitCheck.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rateLimitCheck.resetAt / 1000)),
    },
  };
}

async function logApiCall(
  ctx: any,
  apiKeyId: Id<"apiKeys">,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  request: Request,
  errorMessage?: string,
  requestBody?: any
) {
  await ctx.runMutation(internal.api.logApiCall, {
    apiKeyId,
    endpoint,
    method,
    statusCode,
    responseTime,
    requestBody: requestBody ? JSON.stringify(requestBody).substring(0, 1000) : undefined,
    errorMessage,
    userAgent: request.headers.get("User-Agent") || undefined,
  });
}

// CORS preflight for API
http.route({
  path: "/api/v1/contacts",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

http.route({
  path: "/api/v1/companies",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

http.route({
  path: "/api/v1/deals",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

// CONTACTS API
http.route({
  path: "/api/v1/contacts",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "contacts:read");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
      const cursor = url.searchParams.get("cursor") || undefined;

      const result = await ctx.runQuery(api.contacts.list, { paginationOpts: { numItems: limit, cursor } });
      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, "/api/v1/contacts", "GET", 200, responseTime, request);

      return new Response(JSON.stringify({ data: result.page, pagination: { cursor: result.continueCursor, hasMore: !result.isDone } }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/api/v1/contacts",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "contacts:write");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const body = await request.json();
      if (!body.lastName) {
        return new Response(JSON.stringify({ error: "lastName is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const contactId = await ctx.runMutation(api.contacts.create, {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        title: body.title,
        companyId: body.companyId,
        source: body.source || "api",
        tags: body.tags || [],
      });

      const contact = await ctx.runQuery(api.contacts.get, { id: contactId });
      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, "/api/v1/contacts", "POST", 201, responseTime, request, undefined, body);

      return new Response(JSON.stringify({ data: contact }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  pathPrefix: "/api/v1/contacts/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "contacts:read");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response(JSON.stringify({ error: "Contact ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const contact = await ctx.runQuery(api.contacts.get, { id: id as Id<"contacts"> });
      if (!contact) {
        return new Response(JSON.stringify({ error: "Contact not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, `/api/v1/contacts/${id}`, "GET", 200, responseTime, request);

      return new Response(JSON.stringify({ data: contact }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  pathPrefix: "/api/v1/contacts/",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "contacts:write");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response(JSON.stringify({ error: "Contact ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const body = await request.json();
      await ctx.runMutation(api.contacts.update, { id: id as Id<"contacts">, ...body });
      const contact = await ctx.runQuery(api.contacts.get, { id: id as Id<"contacts"> });

      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, `/api/v1/contacts/${id}`, "PATCH", 200, responseTime, request, undefined, body);

      return new Response(JSON.stringify({ data: contact }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  pathPrefix: "/api/v1/contacts/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "contacts:delete");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response(JSON.stringify({ error: "Contact ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await ctx.runMutation(api.contacts.delete_, { id: id as Id<"contacts"> });

      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, `/api/v1/contacts/${id}`, "DELETE", 204, responseTime, request);

      return new Response(null, { status: 204, headers: { ...corsHeaders, ...validation.rateLimitHeaders } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// COMPANIES API
http.route({
  path: "/api/v1/companies",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "companies:read");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
      const cursor = url.searchParams.get("cursor") || undefined;

      const result = await ctx.runQuery(api.companies.list, { paginationOpts: { numItems: limit, cursor } });
      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, "/api/v1/companies", "GET", 200, responseTime, request);

      return new Response(JSON.stringify({ data: result.page, pagination: { cursor: result.continueCursor, hasMore: !result.isDone } }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/api/v1/companies",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "companies:write");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const body = await request.json();
      if (!body.name) {
        return new Response(JSON.stringify({ error: "name is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const companyId = await ctx.runMutation(api.companies.create, {
        name: body.name,
        domain: body.domain,
        industry: body.industry,
        size: body.size,
        description: body.description,
        phone: body.phone,
        website: body.website,
        tags: body.tags || [],
      });

      const company = await ctx.runQuery(api.companies.get, { id: companyId });
      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, "/api/v1/companies", "POST", 201, responseTime, request, undefined, body);

      return new Response(JSON.stringify({ data: company }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  pathPrefix: "/api/v1/companies/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "companies:read");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response(JSON.stringify({ error: "Company ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const company = await ctx.runQuery(api.companies.get, { id: id as Id<"companies"> });
      if (!company) {
        return new Response(JSON.stringify({ error: "Company not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, `/api/v1/companies/${id}`, "GET", 200, responseTime, request);

      return new Response(JSON.stringify({ data: company }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  pathPrefix: "/api/v1/companies/",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "companies:write");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response(JSON.stringify({ error: "Company ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const body = await request.json();
      await ctx.runMutation(api.companies.update, { id: id as Id<"companies">, ...body });
      const company = await ctx.runQuery(api.companies.get, { id: id as Id<"companies"> });

      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, `/api/v1/companies/${id}`, "PATCH", 200, responseTime, request, undefined, body);

      return new Response(JSON.stringify({ data: company }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  pathPrefix: "/api/v1/companies/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "companies:delete");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response(JSON.stringify({ error: "Company ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await ctx.runMutation(api.companies.delete_, { id: id as Id<"companies"> });

      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, `/api/v1/companies/${id}`, "DELETE", 204, responseTime, request);

      return new Response(null, { status: 204, headers: { ...corsHeaders, ...validation.rateLimitHeaders } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// DEALS API
http.route({
  path: "/api/v1/deals",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "deals:read");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
      const cursor = url.searchParams.get("cursor") || undefined;
      const status = url.searchParams.get("status") as "open" | "won" | "lost" | undefined;

      const result = await ctx.runQuery(api.deals.list, {
        paginationOpts: { numItems: limit, cursor },
        filter: status ? { status } : undefined,
      });

      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, "/api/v1/deals", "GET", 200, responseTime, request);

      return new Response(JSON.stringify({ data: result.page, pagination: { cursor: result.continueCursor, hasMore: !result.isDone } }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  path: "/api/v1/deals",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "deals:write");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const body = await request.json();
      if (!body.name || !body.pipelineId || !body.stageId) {
        return new Response(JSON.stringify({ error: "name, pipelineId, and stageId are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const dealId = await ctx.runMutation(api.deals.create, {
        name: body.name,
        pipelineId: body.pipelineId,
        stageId: body.stageId,
        companyId: body.companyId,
        contactIds: body.contactIds || [],
        amount: body.amount,
        currency: body.currency,
        probability: body.probability,
        expectedCloseDate: body.expectedCloseDate,
        status: body.status,
        tags: body.tags || [],
      });

      const deal = await ctx.runQuery(api.deals.get, { id: dealId });
      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, "/api/v1/deals", "POST", 201, responseTime, request, undefined, body);

      return new Response(JSON.stringify({ data: deal }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  pathPrefix: "/api/v1/deals/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "deals:read");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response(JSON.stringify({ error: "Deal ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const deal = await ctx.runQuery(api.deals.get, { id: id as Id<"deals"> });
      if (!deal) {
        return new Response(JSON.stringify({ error: "Deal not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, `/api/v1/deals/${id}`, "GET", 200, responseTime, request);

      return new Response(JSON.stringify({ data: deal }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  pathPrefix: "/api/v1/deals/",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "deals:write");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response(JSON.stringify({ error: "Deal ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const body = await request.json();
      await ctx.runMutation(api.deals.update, { id: id as Id<"deals">, ...body });
      const deal = await ctx.runQuery(api.deals.get, { id: id as Id<"deals"> });

      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, `/api/v1/deals/${id}`, "PATCH", 200, responseTime, request, undefined, body);

      return new Response(JSON.stringify({ data: deal }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

http.route({
  pathPrefix: "/api/v1/deals/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    try {
      const validation = await validateApiRequest(ctx, request, "deals:delete");
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.statusCode,
          headers: { ...corsHeaders, "Content-Type": "application/json", ...validation.rateLimitHeaders },
        });
      }

      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      if (!id) {
        return new Response(JSON.stringify({ error: "Deal ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await ctx.runMutation(api.deals.delete_, { id: id as Id<"deals"> });

      const responseTime = Date.now() - startTime;
      await logApiCall(ctx, validation.apiKeyId!, `/api/v1/deals/${id}`, "DELETE", 204, responseTime, request);

      return new Response(null, { status: 204, headers: { ...corsHeaders, ...validation.rateLimitHeaders } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// API Documentation endpoint
http.route({
  path: "/api/v1",
  method: "GET",
  handler: httpAction(async () => {
    const docs = {
      version: "1.0.0",
      baseUrl: "/api/v1",
      authentication: { type: "API Key", header: "X-API-Key", alternativeHeader: "Authorization: Bearer <api_key>" },
      rateLimiting: {
        description: "Rate limits are enforced per API key",
        headers: {
          "X-RateLimit-Limit": "Requests allowed per window",
          "X-RateLimit-Remaining": "Requests remaining in current window",
          "X-RateLimit-Reset": "Unix timestamp when the window resets",
        },
      },
      endpoints: {
        contacts: {
          list: { method: "GET", path: "/contacts", permissions: ["contacts:read"] },
          get: { method: "GET", path: "/contacts/:id", permissions: ["contacts:read"] },
          create: { method: "POST", path: "/contacts", permissions: ["contacts:write"] },
          update: { method: "PATCH", path: "/contacts/:id", permissions: ["contacts:write"] },
          delete: { method: "DELETE", path: "/contacts/:id", permissions: ["contacts:delete"] },
        },
        companies: {
          list: { method: "GET", path: "/companies", permissions: ["companies:read"] },
          get: { method: "GET", path: "/companies/:id", permissions: ["companies:read"] },
          create: { method: "POST", path: "/companies", permissions: ["companies:write"] },
          update: { method: "PATCH", path: "/companies/:id", permissions: ["companies:write"] },
          delete: { method: "DELETE", path: "/companies/:id", permissions: ["companies:delete"] },
        },
        deals: {
          list: { method: "GET", path: "/deals", permissions: ["deals:read"] },
          get: { method: "GET", path: "/deals/:id", permissions: ["deals:read"] },
          create: { method: "POST", path: "/deals", permissions: ["deals:write"] },
          update: { method: "PATCH", path: "/deals/:id", permissions: ["deals:write"] },
          delete: { method: "DELETE", path: "/deals/:id", permissions: ["deals:delete"] },
        },
      },
      permissions: [
        "contacts:read", "contacts:write", "contacts:delete",
        "companies:read", "companies:write", "companies:delete",
        "deals:read", "deals:write", "deals:delete",
        "activities:read", "activities:write", "* (full access)",
      ],
      errors: {
        401: "Unauthorized - Missing or invalid API key",
        403: "Forbidden - Insufficient permissions or key expired",
        404: "Not Found - Resource does not exist",
        429: "Too Many Requests - Rate limit exceeded",
        500: "Internal Server Error",
      },
    };
    return new Response(JSON.stringify(docs, null, 2), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }),
});

export default http;
