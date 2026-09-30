export const DEFAULT_API_URL = "https://api.ismalicious.com";

/**
 * Sent as `User-Agent` so the API attributes n8n traffic to this node
 * (`infra/client.rs` matches the `n8n-nodes-ismalicious/` prefix). Keep it in
 * step with `version` in package.json; a test enforces it.
 */
export const USER_AGENT = "n8n-nodes-ismalicious/0.1.1";

export interface CheckRequest {
  url: string;
  query: Record<string, string>;
  headers: Record<string, string>;
}

/**
 * The `GET /check` request for one indicator. Authentication is not added
 * here: the credential's `authenticate` block sets `X-API-KEY` when the node
 * sends the request through `httpRequestWithAuthentication`.
 */
export function buildCheckRequest(options: {
  query: string;
  apiUrl?: string;
}): CheckRequest {
  const query = options.query.trim();
  if (!query) {
    throw new Error("query is required");
  }

  const base = (options.apiUrl || DEFAULT_API_URL).replace(/\/+$/, "");
  return {
    url: `${base}/check`,
    query: { query, enrichment: "standard" },
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  };
}
