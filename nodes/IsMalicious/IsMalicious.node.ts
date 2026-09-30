import {
  NodeApiError,
  NodeConnectionTypes,
  NodeOperationError,
} from "n8n-workflow";
import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  JsonObject,
} from "n8n-workflow";

import { buildCheckRequest } from "../../src/check-request";

export class IsMalicious implements INodeType {
  description: INodeTypeDescription = {
    displayName: "isMalicious",
    name: "isMalicious",
    // One file for both themes: a filled tile with a white glyph reads on
    // either background.
    icon: { light: "file:ismalicious.svg", dark: "file:ismalicious.svg" },
    group: ["transform"],
    version: 1,
    subtitle: "Check indicator",
    description: "Look up an IP, domain, or URL on isMalicious",
    defaults: { name: "isMalicious" },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: "isMaliciousApi", required: true }],
    properties: [
      {
        displayName: "Indicator",
        name: "indicator",
        type: "string",
        default: "",
        required: true,
        placeholder: "e.g. example.com",
        description: "IP address, domain, or URL to check",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    // Read for the API URL only; the key is applied by the credential's
    // `authenticate` block inside httpRequestWithAuthentication.
    const credentials = await this.getCredentials("isMaliciousApi");
    const apiUrl =
      typeof credentials.apiUrl === "string" ? credentials.apiUrl : undefined;
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const indicator = String(
          this.getNodeParameter("indicator", i) ?? "",
        ).trim();
        if (!indicator) {
          throw new NodeOperationError(
            this.getNode(),
            "The indicator is empty",
            {
              itemIndex: i,
              description: "Enter an IP address, domain, or URL to check.",
            },
          );
        }
        const request = buildCheckRequest({ query: indicator, apiUrl });
        const json = (await this.helpers.httpRequestWithAuthentication.call(
          this,
          "isMaliciousApi",
          {
            method: "GET",
            url: request.url,
            qs: request.query,
            headers: request.headers,
            json: true,
          },
        )) as IDataObject;
        returnData.push({ json, pairedItem: { item: i } });
      } catch (error) {
        // An empty indicator is the user's to fix; anything else came from
        // the request and keeps its HTTP context in a NodeApiError (which
        // returns an existing NodeApiError unchanged).
        const nodeError =
          error instanceof NodeOperationError
            ? error
            : new NodeApiError(this.getNode(), error as JsonObject, {
                itemIndex: i,
              });
        // Standard community-node pattern: with "Continue On Fail" enabled,
        // a failing item becomes an error item instead of aborting the batch.
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: nodeError.message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw nodeError;
      }
    }

    return [returnData];
  }
}
