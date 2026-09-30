/** Tests for the isMalicious node and its credential, against n8n-workflow's real error classes */
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  NodeApiError,
  NodeConnectionTypes,
  NodeOperationError,
} from "n8n-workflow";
import type { IExecuteFunctions, INode } from "n8n-workflow";
import { describe, expect, it, vi } from "vitest";

import { IsMaliciousApi } from "../../credentials/IsMaliciousApi.credentials";
import { IsMalicious } from "../../nodes/IsMalicious/IsMalicious.node";
import { USER_AGENT } from "../check-request";

const NODE: INode = {
  id: "node-1",
  name: "isMalicious",
  type: "n8n-nodes-ismalicious.isMalicious",
  typeVersion: 1,
  position: [0, 0],
  parameters: {},
};

function context(options: {
  indicators: string[];
  apiUrl?: string;
  continueOnFail?: boolean;
  request?: (...args: unknown[]) => Promise<unknown>;
}) {
  const httpRequestWithAuthentication = vi.fn(
    options.request ?? (async () => ({ malicious: false })),
  );
  const ctx = {
    getInputData: () => options.indicators.map(() => ({ json: {} })),
    getCredentials: async () => ({
      apiKey: "base64-credential",
      apiUrl: options.apiUrl ?? "https://api.ismalicious.com",
    }),
    getNodeParameter: (_name: string, index: number) =>
      options.indicators[index],
    getNode: () => NODE,
    continueOnFail: () => options.continueOnFail ?? false,
    helpers: { httpRequestWithAuthentication },
  };
  return {
    ctx: ctx as unknown as IExecuteFunctions,
    httpRequestWithAuthentication,
  };
}

describe("IsMalicious node", () => {
  it("sends GET /check through the credential, one paired item per input", async () => {
    const { ctx, httpRequestWithAuthentication } = context({
      indicators: ["8.8.8.8", " evil.example "],
      apiUrl: "https://api.example.test/",
    });

    const [output] = await new IsMalicious().execute.call(ctx);

    expect(output).toEqual([
      { json: { malicious: false }, pairedItem: { item: 0 } },
      { json: { malicious: false }, pairedItem: { item: 1 } },
    ]);
    expect(httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
    const [credentialName, options] =
      httpRequestWithAuthentication.mock.calls[1];
    expect(credentialName).toBe("isMaliciousApi");
    expect(options).toEqual({
      method: "GET",
      url: "https://api.example.test/check",
      qs: { query: "evil.example", enrichment: "standard" },
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      json: true,
    });
  });

  it("rejects an empty indicator as a NodeOperationError without calling the API", async () => {
    const { ctx, httpRequestWithAuthentication } = context({
      indicators: ["  "],
    });

    const error = await new IsMalicious().execute
      .call(ctx)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NodeOperationError);
    expect((error as NodeOperationError).context.itemIndex).toBe(0);
    expect(httpRequestWithAuthentication).not.toHaveBeenCalled();
  });

  it("wraps a failed request in a NodeApiError", async () => {
    const { ctx } = context({
      indicators: ["8.8.8.8"],
      request: async () => {
        throw Object.assign(new Error("Request failed with status code 401"), {
          httpCode: "401",
        });
      },
    });

    const error = await new IsMalicious().execute
      .call(ctx)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NodeApiError);
    expect((error as NodeApiError).httpCode).toBe("401");
  });

  it("turns a failure into an error item when Continue On Fail is on", async () => {
    const { ctx } = context({
      indicators: ["", "8.8.8.8"],
      continueOnFail: true,
    });

    const [output] = await new IsMalicious().execute.call(ctx);

    expect(output).toEqual([
      { json: { error: "The indicator is empty" }, pairedItem: { item: 0 } },
      { json: { malicious: false }, pairedItem: { item: 1 } },
    ]);
  });

  it("declares what community-node verification requires", () => {
    const { description } = new IsMalicious();

    expect(description.usableAsTool).toBe(true);
    expect(description.subtitle).toBeTruthy();
    expect(description.inputs).toEqual([NodeConnectionTypes.Main]);
    expect(description.outputs).toEqual([NodeConnectionTypes.Main]);
    expect(description.credentials).toEqual([
      { name: new IsMaliciousApi().name, required: true },
    ]);
  });
});

describe("IsMaliciousApi credential", () => {
  const credential = new IsMaliciousApi();

  it("sends the key as X-API-KEY", () => {
    expect(credential.authenticate).toEqual({
      type: "generic",
      properties: { headers: { "X-API-KEY": "={{$credentials.apiKey}}" } },
    });
  });

  it("tests against GET /gate/quota, which is authenticated and unmetered", () => {
    expect(credential.test?.request).toMatchObject({
      url: "/gate/quota",
      method: "GET",
    });
    expect(credential.test?.request.baseURL).toContain("$credentials.apiUrl");
  });

  it("points its icon at the node's SVG", () => {
    const root = join(__dirname, "..", "..", "credentials");
    const icon = credential.icon as { light: string; dark: string };
    for (const path of [icon.light, icon.dark]) {
      expect(existsSync(join(root, path.replace(/^file:/, "")))).toBe(true);
    }
  });
});
