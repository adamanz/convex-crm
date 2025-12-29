/**
 * Slack API utilities and constants for Momentum
 */

export const SLACK_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID || "",
  CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET || "",
  SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET || "",
  REDIRECT_URI: process.env.SLACK_REDIRECT_URI || "http://localhost:3000/api/slack/oauth/callback",
  SCOPES: [
    "app_mentions:read",
    "channels:history",
    "channels:manage",
    "channels:read",
    "chat:write",
    "chat:write.customize",
    "commands",
    "dnd:read",
    "emoji:read",
    "files:read",
    "files:write",
    "groups:history",
    "groups:read",
    "im:history",
    "im:read",
    "links:read",
    "metadata.message:read",
    "mpim:history",
    "mpim:read",
    "pins:read",
    "reactions:read",
    "reminders:read",
    "reminders:write",
    "team:read",
    "users:read",
    "users.profile:read",
    "workflow.steps:execute",
  ],
};

export const SLACK_API_BASE_URL = "https://slack.com/api";

/**
 * Slack API endpoints
 */
export const SLACK_API_ENDPOINTS = {
  OAUTH_V2_ACCESS: `${SLACK_API_BASE_URL}/oauth.v2.access`,
  AUTH_TEST: `${SLACK_API_BASE_URL}/auth.test`,
  CONVERSATIONS_LIST: `${SLACK_API_BASE_URL}/conversations.list`,
  CONVERSATIONS_HISTORY: `${SLACK_API_BASE_URL}/conversations.history`,
  CONVERSATIONS_INFO: `${SLACK_API_BASE_URL}/conversations.info`,
  USERS_LIST: `${SLACK_API_BASE_URL}/users.list`,
  USERS_INFO: `${SLACK_API_BASE_URL}/users.info`,
  CHAT_POST_MESSAGE: `${SLACK_API_BASE_URL}/chat.postMessage`,
  VIEWS_OPEN: `${SLACK_API_BASE_URL}/views.open`,
  VIEWS_UPDATE: `${SLACK_API_BASE_URL}/views.update`,
};

/**
 * Signal type keywords for Momentum detection
 */
export const SIGNAL_KEYWORDS = {
  expansion: [
    "need more",
    "capacity",
    "scale",
    "growth",
    "increase users",
    "new team",
    "add seats",
    "more features",
    "upgrade",
    "expand",
    "growing",
  ],
  risk: [
    "can't work",
    "frustrated",
    "bug",
    "support slow",
    "alternatives",
    "budget cut",
    "pause",
    "considering switching",
    "not working",
    "broken",
    "outage",
    "complaint",
  ],
  buying_intent: [
    "how much",
    "cost",
    "pricing",
    "demo",
    "when available",
    "interested in",
    "want to know",
    "tell me more",
    "sign up for",
    "trial",
  ],
  usage: [
    "using",
    "integrated with",
    "rolled out",
    "deployed",
    "implementation",
    "adoption",
    "utilizing",
  ],
  churn: [
    "migrate",
    "competitor",
    "contract over",
    "renewal",
    "quit",
    "cancel",
    "leave",
    "move to",
    "switch",
  ],
  relationship: [
    "new hire",
    "left",
    "joined",
    "promoted",
    "org change",
    "restructure",
    "team change",
  ],
};

/**
 * Sentiment keywords for basic sentiment analysis
 */
export const SENTIMENT_KEYWORDS = {
  positive: ["awesome", "love", "great", "excellent", "perfect", "fantastic", "amazing", "saved us"],
  negative: ["hate", "frustrated", "broken", "doesn't work", "terrible", "worst", "bad", "pain"],
  urgent: ["asap", "urgent", "critical", "immediately", "now", "emergency", "down"],
};

/**
 * Verify Slack request signature
 * https://api.slack.com/authentication/verifying-requests-from-slack
 */
export function verifySlackSignature(
  signingSecret: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const crypto = require("crypto");

  // Check if timestamp is within 5 minutes
  const time = Math.floor(Date.now() / 1000);
  if (Math.abs(time - parseInt(timestamp)) > 300) {
    return false;
  }

  const baseString = `v0:${timestamp}:${body}`;
  const mySignature = "v0=" + crypto.createHmac("sha256", signingSecret).update(baseString).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(mySignature));
}

/**
 * Build Slack OAuth authorization URL
 */
export function getSlackAuthorizationUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: SLACK_CONFIG.CLIENT_ID,
    scope: SLACK_CONFIG.SCOPES.join(","),
    redirect_uri: SLACK_CONFIG.REDIRECT_URI,
  });

  if (state) {
    params.append("state", state);
  }

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeOAuthCode(code: string): Promise<{
  ok: boolean;
  access_token?: string;
  token_type?: string;
  scope?: string;
  bot_user_id?: string;
  app_id?: string;
  team?: { id: string; name: string };
  authed_user?: { id: string };
  error?: string;
}> {
  const response = await fetch(SLACK_API_ENDPOINTS.OAUTH_V2_ACCESS, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: SLACK_CONFIG.CLIENT_ID,
      client_secret: SLACK_CONFIG.CLIENT_SECRET,
      code,
      redirect_uri: SLACK_CONFIG.REDIRECT_URI,
    }).toString(),
  });

  const data = await response.json();
  return data;
}

/**
 * Make authenticated Slack API request
 */
export async function callSlackApi(
  endpoint: string,
  token: string,
  method: "GET" | "POST" = "GET",
  params?: Record<string, any>
): Promise<any> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let url = endpoint;
  let body: string | undefined;

  if (method === "GET" && params) {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }
    url = `${endpoint}?${queryParams.toString()}`;
  } else if (method === "POST" && params) {
    body = JSON.stringify(params);
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data;
}

/**
 * Detect signal type based on message content
 */
export function detectSignalType(
  text: string
): { type: string; confidence: number } | null {
  const lowerText = text.toLowerCase();

  for (const [signalType, keywords] of Object.entries(SIGNAL_KEYWORDS)) {
    const matches = keywords.filter((keyword) => lowerText.includes(keyword));

    if (matches.length > 0) {
      // Confidence based on number of keyword matches and message length
      const confidence = Math.min(100, (matches.length / keywords.length) * 100);
      return { type: signalType, confidence };
    }
  }

  return null;
}

/**
 * Analyze sentiment of message
 */
export function analyzeSentiment(text: string): {
  sentiment: "positive" | "negative" | "neutral";
  urgency: boolean;
  score: number;
} {
  const lowerText = text.toLowerCase();

  let score = 0;
  let hasPositive = false;
  let hasNegative = false;

  for (const word of SENTIMENT_KEYWORDS.positive) {
    if (lowerText.includes(word)) {
      score += 1;
      hasPositive = true;
    }
  }

  for (const word of SENTIMENT_KEYWORDS.negative) {
    if (lowerText.includes(word)) {
      score -= 1;
      hasNegative = true;
    }
  }

  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  if (hasPositive && !hasNegative) sentiment = "positive";
  if (hasNegative && !hasPositive) sentiment = "negative";

  const urgency = SENTIMENT_KEYWORDS.urgent.some((word) => lowerText.includes(word));

  return {
    sentiment,
    urgency,
    score,
  };
}

/**
 * Extract mentions from message text
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /<@([A-Z0-9]+)>/g;
  const matches = text.match(mentionRegex) || [];
  return matches.map((match) => match.replace(/<@|>/g, ""));
}

/**
 * Extract email from message
 */
export function extractEmails(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return text.match(emailRegex) || [];
}

/**
 * Extract company names (simple heuristic)
 */
export function extractCompanyMentions(text: string): string[] {
  // Look for patterns like: "at CompanyName", "with CompanyName", etc.
  const patterns = [
    /(?:at|from|with|for)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g,
    /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:team|company|org)/g,
  ];

  const mentions = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      mentions.add(match[1]);
    }
  }

  return Array.from(mentions);
}
