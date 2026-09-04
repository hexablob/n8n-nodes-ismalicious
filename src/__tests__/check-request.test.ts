import { describe, expect, it } from "vitest";

import { buildCheckRequest, DEFAULT_API_URL } from "../check-request";

describe("buildCheckRequest", () => {
  it("builds GET /check with X-API-KEY", () => {
    const request = buildCheckRequest({
      query: "8.8.8.8",
      apiKey: "base64-credential",
    });

    expect(request.url).toBe(`${DEFAULT_API_URL}/check`);
    expect(request.query).toEqual({ query: "8.8.8.8", enrichment: "standard" });
    expect(request.headers["X-API-KEY"]).toBe("base64-credential");
  });

  it("strips a trailing slash from a custom API URL", () => {
    const request = buildCheckRequest({
      query: "evil.example",
      apiKey: "k",
      apiUrl: "https://api.example.test/",
    });
    expect(request.url).toBe("https://api.example.test/check");
  });

  it("rejects a blank query", () => {
    expect(() => buildCheckRequest({ query: "  ", apiKey: "k" })).toThrow(
      "query is required",
    );
  });
});
