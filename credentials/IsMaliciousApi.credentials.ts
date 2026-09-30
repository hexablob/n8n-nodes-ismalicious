import type {
  IAuthenticateGeneric,
  Icon,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

export class IsMaliciousApi implements ICredentialType {
  name = "isMaliciousApi";

  displayName = "isMalicious API";

  // One file for both themes: a filled tile with a white glyph reads on
  // either background.
  icon: Icon = {
    light: "file:../nodes/IsMalicious/ismalicious.svg",
    dark: "file:../nodes/IsMalicious/ismalicious.svg",
  };

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

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        "X-API-KEY": "={{$credentials.apiKey}}",
      },
    },
  };

  // GET /gate/quota is authenticated (a bad key answers 401) and sits outside
  // the request quota, so testing the credential never spends a check.
  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.apiUrl || "https://api.ismalicious.com"}}',
      url: "/gate/quota",
      method: "GET",
    },
  };
}
