// src/nodes/SmartSuite/methods/loadOptions.ts
import type {
  ILoadOptionsFunctions,
  INodePropertyOptions,
  INodeListSearchItems,
} from 'n8n-workflow';
import { apiRequest } from '../transport/smartSuiteApi';
import {
  asIdString,
  isReservedField,
  debugLog,
} from '../helpers/utils';
import { filterOptionsByFieldType } from '../helpers/getFilterOptions';
import {
  searchTableFields as rawSearchTableFields,
  searchTableFieldsMutable as rawSearchTableFieldsMutable,
} from './listSearch';

/**
 * 1) Operations picker
 */
export async function getOperations(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  debugLog('[LoadOptions] getOperations called', this.getNodeParameter('resource'), 2);
  const resource = this.getNodeParameter('resource', 'record') as string;
  const map: Record<string, INodePropertyOptions[]> = {
    record: [
      { name: 'Search Records', value: 'searchRecord', action: 'Search Records' },
      { name: 'Get Record',     value: 'getRecord',    action: 'Get Record'    },
      { name: 'List Records',   value: 'listRecord',   action: 'List Records'  },
      { name: 'Create Record',  value: 'createRecord', action: 'Create Record' },
      { name: 'Update Record',  value: 'updateRecord', action: 'Update Record' },
      { name: 'Delete Record',  value: 'deleteRecord', action: 'Delete Record' },
      { name: 'Upsert Record',  value: 'upsertRecord', action: 'Upsert Record' },
    ],
    table: [
      { name: 'List Tables',        value: 'listTable',         action: 'List Tables'         },
      { name: 'Get Table',          value: 'getTable',          action: 'Get Table'           },
      { name: 'Create Table',       value: 'createTable',       action: 'Create Table'        },
      { name: 'Create Table Field', value: 'createTableField',  action: 'Create Table Field'   },
    ],
    solution: [
      { name: 'List Solutions', value: 'listSolution', action: 'List Solutions' },
      { name: 'Get Solution',   value: 'getSolution',  action: 'Get Solution'   },
    ],
    orgManagement: [
      { name: 'List Members',     value: 'listMembers',     action: 'List Members'      },
      { name: 'List Teams',       value: 'listTeams',       action: 'List Teams'        },
      { name: 'Get Current User', value: 'getCurrentUser', action: 'Get Current User' },
    ],
  };
  return map[resource] ?? [];
}

// Cache each table's structure so we only fetch it once per editor session
const tableStructureCache = new Map<
  string,
  Array<{ slug: string; label: string; field_type: string }>
>();

/**
 * 2) Load ALL table fields (including reserved and record-ID fields)
 */
export async function getTableFields(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  debugLog('[LoadOptions] getTableFields called', undefined, 2);
  const { results } = await rawSearchTableFields.call(this);
  debugLog('[LoadOptions] getTableFields raw', results, 2);
  return (results as INodeListSearchItems[]).map(({ name, value }) => ({ name: String(name), value: String(value) }));
}

/**
 * 3) Load only mutable table fields (exclude reserved and record-ID fields)
 */
export async function getMutableTableFields(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  debugLog('[LoadOptions] getMutableTableFields called', undefined, 2);
  const { results } = await rawSearchTableFieldsMutable.call(this);
  debugLog('[LoadOptions] getMutableTableFields raw', results, 2);
  const filtered = (results as INodeListSearchItems[]).filter(
    (f) =>
      !isReservedField(String(f.value)) &&
      !(f.description ?? '').toLowerCase().includes('recordidfield'),
  );
  debugLog('[LoadOptions] getMutableTableFields filtered', filtered, 2);
  return filtered.map(({ name, value }) => ({ name: String(name), value: String(value) }));
}

/**
 * 4) Get filter operators for a given field type (supports upsert and search)
 */
export async function getFilterOptionsForFieldType(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  // Determine operation context
  const operation = this.getNodeParameter('operation') as string;
  let rawField: unknown;
  if (operation === 'upsertRecord') {
    rawField = this.getCurrentNodeParameter('matchingField');
  } else {
    rawField = this.getCurrentNodeParameter('filters.filter[0].field');
  }
  debugLog('[LoadOptions] getFilterOptionsForFieldType called', { operation, rawField }, 2);

  let slug = '';
  if (
    rawField &&
    typeof rawField === 'object' &&
    'value' in (rawField as any)
  ) {
    slug = asIdString((rawField as any).value);
  } else if (typeof rawField === 'string') {
    slug = asIdString(rawField);
  }
  if (!slug) return [];

  const tableId = asIdString(
    this.getNodeParameter('tableId', 0) as string,
  );
  if (!tableId) return [];

  debugLog('[LoadOptions] getFilterOptionsForFieldType slug', slug, 2);
  let structure = tableStructureCache.get(tableId);
  if (!structure) {
    const resp = (await apiRequest.call(
      this,
      'GET',
      `/applications/${tableId}/`,
    )) as {
      structure?: Array<{ slug: string; label: string; field_type: string }>;
    };
    structure = resp.structure || [];
    tableStructureCache.set(tableId, structure);
  }

  const def = structure.find((f) => f.slug === slug);
  const ops = def ? filterOptionsByFieldType[def.field_type] : [];
  debugLog('[LoadOptions] getFilterOptionsForFieldType ops', ops, 2);
  return ops.map((op) => ({
    name: op.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: op,
  }));
}

/**
 * 5) Dynamic search methods
 */
export async function searchTableFields(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  debugLog('[LoadOptions] searchTableFields called', undefined, 2);
  return getTableFields.call(this);
}

export async function searchTableFieldsMutable(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  debugLog('[LoadOptions] searchTableFieldsMutable called', undefined, 2);
  return getMutableTableFields.call(this);
}

export const loadOptions = {
  getOperations,
  getTableFields,
  getMutableTableFields,
  getFilterOptionsForFieldType,
  searchTableFields,
  searchTableFieldsMutable,
};
