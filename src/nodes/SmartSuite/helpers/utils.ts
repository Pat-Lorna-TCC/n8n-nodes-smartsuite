// src/nodes/SmartSuite/helpers/utils.ts

import { NodeOperationError } from 'n8n-workflow';
import type { IExecuteFunctions } from 'n8n-workflow';

/**
 * Flattens an n8n “resourceLocator” value into its raw ID string.
 */
export function asIdString(input: unknown): string {
  if (typeof input === 'object' && input !== null && 'value' in (input as any)) {
    return (input as any).value as string;
  }
  return String(input ?? '');
}

/**
 * Debug logger (gated by SMARTSUITE_DEBUG / SMARTSUITE_DEBUG_LEVEL).
 */
export function debugLog(msg: string, data?: unknown, level = 1) {
  const envDebug = process.env.SMARTSUITE_DEBUG?.toLowerCase() === 'true';
  const envLevel = parseInt(process.env.SMARTSUITE_DEBUG_LEVEL || '1', 10);
  if (!envDebug || envLevel < level) return;
  console.log('[SmartSuite DEBUG]', msg, ...(data !== undefined ? [data] : []));
}

/**
 * Validate a resourceLocator (list/id): throw NodeOperationError if missing or invalid.
 */
export function requireParam(
  this: IExecuteFunctions,
  paramName: string,
  label: string,
  itemIndex = 0,
  pattern?: RegExp,
  patternMessage?: string,
): string {
  const raw = this.getNodeParameter(paramName, itemIndex);
  const id = asIdString(raw);
  if (!id) {
    throw new NodeOperationError(
      this.getNode(),
      `${label} must be selected.`,
      { itemIndex },
    );
  }
  if (pattern && !pattern.test(id)) {
    throw new NodeOperationError(
      this.getNode(),
      patternMessage ?? `${label} must be valid.`,
      { itemIndex },
    );
  }
  return id;
}

/**
 * Fields that SmartSuite manages internally (cannot be set via API).
 */
export const RESERVED_FIELDS = [
  'autonumber',
  'count',
  'first_created',
  'formula',
  'last_updated',
  'record_id',
  'rollup',
  'vote',
] as const;

/**
 * Test whether a field-slug is one of those reserved.
 */
export function isReservedField(slug: string): boolean {
  return (RESERVED_FIELDS as readonly string[]).includes(slug);
}

/**
 * Attempt to JSON-parse a string. Returns the parsed value on success, null on failure.
 * Used to normalize field values that may contain JSON arrays (e.g. LinkedRecord multi-value).
 */
export function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export interface SmartSuiteFullName {
  sys_root: string;
  salutation: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
}

/**
 * Converts a full name string (e.g. "John Doe") into the SmartSuite
 * fullnamefield object format. If the input is already an object with
 * the expected keys, it is normalized and passed through.
 */
export function parseFullName(value: unknown): SmartSuiteFullName {
  if (typeof value === 'object' && value !== null) {
    const v = value as Record<string, unknown>;
    return {
      sys_root:    String(v.sys_root    ?? ''),
      salutation:  String(v.salutation  ?? ''),
      first_name:  String(v.first_name  ?? ''),
      middle_name: String(v.middle_name ?? ''),
      last_name:   String(v.last_name   ?? ''),
      suffix:      String(v.suffix      ?? ''),
    };
  }
  const str = String(value ?? '').trim();
  const parts = str.split(/\s+/).filter(Boolean);
  let firstName = '';
  let middleName = '';
  let lastName = '';
  if (parts.length === 0) {
    // no-op — all empty
  } else if (parts.length === 1) {
    firstName = parts[0];
  } else if (parts.length === 2) {
    [firstName, lastName] = parts;
  } else {
    firstName  = parts[0];
    lastName   = parts[parts.length - 1];
    middleName = parts.slice(1, -1).join(' ');
  }
  return {
    sys_root:    str,
    salutation:  '',
    first_name:  firstName,
    middle_name: middleName,
    last_name:   lastName,
    suffix:      '',
  };
}
