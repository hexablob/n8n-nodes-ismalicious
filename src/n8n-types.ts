/**
 * Minimal n8n-workflow shapes so this package typechecks without depending on
 * n8n-workflow (verified community nodes cannot ship runtime dependencies).
 * Replace these imports with `n8n-workflow` when compiling inside n8n's toolchain.
 */

export interface INodeProperties {
  displayName: string;
  name: string;
  type: string;
  default?: unknown;
  required?: boolean;
  description?: string;
  options?: Array<{ name: string; value: string }>;
  typeOptions?: { password?: boolean };
}

export interface ICredentialType {
  name: string;
  displayName: string;
  documentationUrl?: string;
  properties: INodeProperties[];
}

export interface INodeTypeDescription {
  displayName: string;
  name: string;
  icon?: string;
  group: string[];
  version: number;
  description: string;
  defaults: { name: string };
  inputs: string[];
  outputs: string[];
  credentials: Array<{ name: string; required?: boolean }>;
  properties: INodeProperties[];
}

export interface INodeExecutionData {
  json: Record<string, unknown>;
  pairedItem?: { item: number } | number;
}

export interface IExecuteFunctions {
  getInputData(): INodeExecutionData[];
  getNodeParameter(name: string, itemIndex: number): unknown;
  getCredentials(name: string): Promise<Record<string, string>>;
  continueOnFail(): boolean;
  helpers: {
    httpRequest(options: {
      method: string;
      url: string;
      qs?: Record<string, string>;
      headers?: Record<string, string>;
      json?: boolean;
    }): Promise<unknown>;
  };
}

export interface INodeType {
  description: INodeTypeDescription;
  execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
