import { buildCheckRequest } from "../../src/check-request";
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "../../src/n8n-types";

export class IsMalicious implements INodeType {
  description: INodeTypeDescription = {
    displayName: "isMalicious",
    name: "isMalicious",
    icon: "file:ismalicious.svg",
    group: ["transform"],
    version: 1,
    description: "Look up an IP, domain, or URL on isMalicious",
    defaults: { name: "isMalicious" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "isMaliciousApi", required: true }],
    properties: [
      {
        displayName: "Indicator",
        name: "indicator",
        type: "string",
        default: "",
        required: true,
        description: "IP address, domain, or URL to check",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const credentials = await this.getCredentials("isMaliciousApi");
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const indicator = String(this.getNodeParameter("indicator", i) ?? "");
        const request = buildCheckRequest({
          query: indicator,
          apiKey: credentials.apiKey,
          apiUrl: credentials.apiUrl,
        });
        const json = (await this.helpers.httpRequest({
          method: "GET",
          url: request.url,
          qs: request.query,
          headers: request.headers,
          json: true,
        })) as Record<string, unknown>;
        returnData.push({ json, pairedItem: { item: i } });
      } catch (error) {
        // Standard community-node pattern: with "Continue On Fail" enabled,
        // a failing item becomes an error item instead of aborting the batch.
        if (this.continueOnFail()) {
          const message = error instanceof Error ? error.message : String(error);
          returnData.push({ json: { error: message }, pairedItem: { item: i } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
