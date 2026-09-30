import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildCheckRequest,
  DEFAULT_API_URL,
  USER_AGENT,
} from "../check-request";

describe("buildCheckRequest", () => {
  it("builds GET /check with the node's User-Agent and no credential", () => {
    const request = buildCheckRequest({ query: "8.8.8.8" });

    expect(request.url).toBe(`${DEFAULT_API_URL}/check`);
    expect(request.query).toEqual({ query: "8.8.8.8", enrichment: "standard" });
    expect(request.headers["User-Agent"]).toBe(USER_AGENT);
    // The credential's `authenticate` block adds X-API-KEY, not this helper.
    expect(request.headers).not.toHaveProperty("X-API-KEY");
  });

  it("strips trailing slashes from a custom API URL", () => {
    const request = buildCheckRequest({
      query: "evil.example",
      apiUrl: "https://api.example.test//",
    });
    expect(request.url).toBe("https://api.example.test/check");
  });

  it("rejects a blank query", () => {
    expect(() => buildCheckRequest({ query: "  " })).toThrow(
      "query is required",
    );
  });

  it("names the published version in the User-Agent", () => {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "..", "..", "package.json"), "utf8"),
    ) as { name: string; version: string };
    expect(USER_AGENT).toBe(`${pkg.name}/${pkg.version}`);
  });
});
