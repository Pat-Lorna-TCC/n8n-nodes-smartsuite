// src/nodes/SmartSuite/helpers/validation.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { requireParam } from './utils';
import { apiRequest } from '../transport/smartSuiteApi';

/**
 * Ensures solutionId is present, then verifies it exists.
 */
export async function getSolutionId(
  this: IExecuteFunctions,
  itemIndex = 0,
): Promise<string> {
  const id = requireParam.call(this, 'solutionId', 'Solution', itemIndex);
  try {
    await apiRequest.call(this, 'GET', `/solutions/${id}/`);
  } catch (err: any) {
    if (err.message.includes('404')) {
      throw new NodeOperationError(
        this.getNode(),
        `Solution not found for ID "${id}".`,
        { itemIndex },
      );
    }
    throw err;
  }
  return id;
}

export interface FieldDefinition {
  slug: string;
  label: string;
  field_type: string;
}

/**
 * Ensures tableId is present, verifies it exists, AND returns the table's field
 * structure (so callers can apply field-type-aware payload transformations).
 * Zero extra API calls vs. getTableId — the GET was already happening.
 */
export async function getTableIdWithStructure(
  this: IExecuteFunctions,
  itemIndex = 0,
): Promise<{ id: string; structure: FieldDefinition[] }> {
  const id = requireParam.call(this, 'tableId', 'Table', itemIndex);
  let structure: FieldDefinition[] = [];
  try {
    const resp = (await apiRequest.call(this, 'GET', `/applications/${id}`)) as {
      structure?: FieldDefinition[];
    };
    structure = resp?.structure ?? [];
  } catch (err: any) {
    if (err.message.includes('404')) {
      throw new NodeOperationError(
        this.getNode(),
        `Table not found for ID "${id}".`,
        { itemIndex },
      );
    }
    throw err;
  }
  return { id, structure };
}

/**
 * Ensures tableId is present, then verifies it exists.
 * Thin backward-compat wrapper over getTableIdWithStructure.
 */
export async function getTableId(
  this: IExecuteFunctions,
  itemIndex = 0,
): Promise<string> {
  const { id } = await getTableIdWithStructure.call(this, itemIndex);
  return id;
}
