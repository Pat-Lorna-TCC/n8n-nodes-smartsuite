// src/nodes/SmartSuite/helpers/getValidFilters.ts

import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

/**
 * Return the full list of all supported filter operators,
 * each with a subtitle‐style description for the dropdown.
 */
export async function getAllFilterConditions(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  const ops: Array<[string, string]> = [
    ['contains',             'String contains the value (most fields)'],
    ['not_contains',         'String does not contains value (most fields)'],
    ['is',                   'Equal to date (date fields)'],
    ['is_not',               'Not equal to date (date fields)'],
    ['is_empty',             'Field has no value (most fields)'],
    ['is_not_empty',         'Field has some value (most fields)'],
    ['has_all_of',           'Arrays, multiple select, linked record'],
    ['has_any_of',           'Arrays, multiple select, linked record'],
    ['has_none_of',          'Multiple select, linked record'],
    ['is_any_of',            'Status & single select'],
    ['is_before',            'Before date (date fields)'],
    ['is_equal_or_greater_than', 'Numeric field'],
    ['is_equal_or_less_than',    'Numeric field'],
    ['is_equal_to',              'Numeric field'],
    ['is_exactly',               'Multiple select, linked record'],
    ['is_greater_than',          'Numeric field'],
    ['is_less_than',             'Numeric field'],
    ['is_not_equal_to',          'Numeric field'],
    ['is_not_overdue',           'Due date'],
    ['is_none_of',               'Status & single select'],
    ['is_on_or_after',           'Date field'],
    ['is_on_or_before',          'Date field'],
    ['is_overdue',               'Due date'],
    ['file_name_contains',       'Files & Images'],
    ['file_type_is',             'Files & Images'],
  ];

  return ops.map(([value, description]) => ({
    name: value
      .split('_')
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' '),
    value,
    description,
    default: value,
  }));
}
