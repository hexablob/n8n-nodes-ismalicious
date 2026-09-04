import type { ICredentialType, INodeProperties } from "../src/n8n-types";

export class IsMaliciousApi implements ICredentialType {
  name = "isMaliciousApi";
  displayName = "isMalicious API";
  documentationUrl = "https://ismalicious.com/api-docs/authentication";
  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
      description:
        "Dashboard API credential (Base64 of apiKey:apiSecret). Sent as X-API-KEY.",
    },
    {
      displayName: "API URL",
      name: "apiUrl",
      type: "string",
      default: "https://api.ismalicious.com",
      description: "Override only for a private API host.",
    },
  ];
}
