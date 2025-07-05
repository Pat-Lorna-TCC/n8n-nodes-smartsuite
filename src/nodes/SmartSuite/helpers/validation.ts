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

/**
 * Ensures tableId is present, then verifies it exists.
 */
export async function getTableId(
  this: IExecuteFunctions,
  itemIndex = 0,
): Promise<string> {
  const id = requireParam.call(this, 'tableId', 'Table', itemIndex);
  try {
    await apiRequest.call(this, 'GET', `/applications/${id}`);
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
  return id;
}
