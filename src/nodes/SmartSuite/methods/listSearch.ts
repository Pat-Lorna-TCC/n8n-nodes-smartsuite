// src/nodes/SmartSuite/methods/listSearch.ts

import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { asIdString, isReservedField } from '../helpers/utils';
import { apiRequest } from '../transport/smartSuiteApi';

// Helper to map fields for resourceLocator (supports description property)
const serializeField = (f: { slug: string; label: string; field_type: string }) => ({
  name:        `${f.label} (${f.field_type})`,
  value:       f.slug,
  description: `Type: ${f.field_type}`,
});

export const solutionSearch = async function (
  this: ILoadOptionsFunctions,
  filter = '',
): Promise<INodeListSearchResult> {
  const all: Array<{ id: string; name: string }> = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const resp = (await apiRequest.call(
      this,
      'GET',
      '/solutions/',
      {},
      { limit, offset },
    )) as any;
    const page = Array.isArray(resp) ? resp : resp.results || [];
    if (!page.length) break;
    all.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }

  const filtered = all.filter((s) =>
    !filter || s.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const results = filtered
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => ({ name: s.name, value: s.id }));

  return { results };
};

export const tableSearch = async function (
  this: ILoadOptionsFunctions,
  filter = '',
): Promise<INodeListSearchResult> {
  const solutionId = asIdString(this.getNodeParameter('solutionId', 0));
  if (!solutionId) return { results: [] };

  const resp = (await apiRequest.call(
    this,
    'GET',
    `/applications/?solution=${solutionId}`,
  )) as Array<{ id: string; name: string }>;

  const filtered = resp.filter((t) =>
    !filter || t.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const results = filtered
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ name: t.name, value: t.id }));

  return { results };
};

export const searchTableFields = async function (
  this: ILoadOptionsFunctions,
  filter = '',
): Promise<INodeListSearchResult> {
  const tableId = asIdString(this.getNodeParameter('tableId', 0));
  if (!tableId) return { results: [] };

  const { structure = [] } = (await apiRequest.call(
    this,
    'GET',
    `/applications/${tableId}/`,
  )) as { structure?: Array<{ slug: string; label: string; field_type: string }> };

  const filtered = structure.filter(
    (f) =>
      !filter ||
      f.label.toLowerCase().includes(filter.toLowerCase()) ||
      f.slug.toLowerCase().includes(filter.toLowerCase()),
  );

  const results = filtered.map(serializeField);
  return { results };
};

export const searchTableFieldsMutable = async function (
  this: ILoadOptionsFunctions,
  filter = '',
): Promise<INodeListSearchResult> {
  const tableId = asIdString(this.getNodeParameter('tableId', 0));
  if (!tableId) return { results: [] };

  const { structure = [] } = (await apiRequest.call(
    this,
    'GET',
    `/applications/${tableId}/`,
  )) as { structure?: Array<{ slug: string; label: string; field_type: string }> };

  // Exclude reserved fields
  const withoutReserved = structure.filter((f) => !isReservedField(f.slug));
  // Exclude record ID fields
  const withoutRecordId = withoutReserved.filter(
    (f) => f.field_type !== 'recordidfield',
  );
  // Apply search filter
  const filtered = withoutRecordId.filter((f) =>
    !filter ||
    f.label.toLowerCase().includes(filter.toLowerCase()) ||
    f.slug.toLowerCase().includes(filter.toLowerCase()),
  );

  const results = filtered.map(serializeField);
  return { results };
};

export const listSearch = {
  solutionSearch,
  tableSearch,
  searchTableFields,
  searchTableFieldsMutable,
};
