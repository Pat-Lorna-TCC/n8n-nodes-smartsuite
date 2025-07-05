// src/__mocks__/n8n-core.ts
export interface IExecuteFunctions {
  getNodeParameter(name: string, index?: number): any;
  helpers: {
    makeApiRequest: (...args: any[]) => Promise<any>;
  };
}
