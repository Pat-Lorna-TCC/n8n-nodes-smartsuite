// src/types/n8n-core.d.ts
declare module 'n8n-core' {
  // minimal IExecuteFunctions stub—add whatever shape your code actually uses
  export interface IExecuteFunctions {
    getNodeParameter(paramName: string, itemIndex?: number): any;
    helpers: {
      makeApiRequest: (...args: any[]) => Promise<any>;
    };
  }
}
