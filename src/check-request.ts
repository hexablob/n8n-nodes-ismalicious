export const DEFAULT_API_URL = "https://api.ismalicious.com";

export interface CheckRequest {
  url: string;
  query: Record<string, string>;
  headers: Record<string, string>;
}

export function buildCheckRequest(options: {
  query: string;
  apiKey: string;
  apiUrl?: string;
}): CheckRequest {
  const query = options.query.trim();
  if (!query) {
    throw new Error("query is required");
  }
  if (!options.apiKey) {
    throw new Error("apiKey is required");
  }

  const base = (options.apiUrl || DEFAULT_API_URL).replace(/\/$/, "");
  return {
    url: `${base}/check`,
    query: { query, enrichment: "standard" },
    headers: {
      "X-API-KEY": options.apiKey,
      Accept: "application/json",
    },
  };
}
