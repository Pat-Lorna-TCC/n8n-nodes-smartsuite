// src/nodes/SmartSuite/types.ts

export interface SmartSuiteRecord {
  /** Unique record identifier */
  id: string;
  /** Additional dynamic fields */
  [key: string]: any;
}

export type SmartSuiteListPayload<T> =
  | T[]
  | { data?: T[]; items?: T[]; results?: T[] };
