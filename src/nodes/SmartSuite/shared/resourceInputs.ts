// src/nodes/SmartSuite/shared/resourceInputs.ts

import type { INodeProperties } from 'n8n-workflow';

/**
 * Re-usable “Solution” input with Fixed | Expression toggle enabled.
 */
export const solutionInput: INodeProperties = {
  displayName:      'Solution',
  name:             'solutionId',
  type:             'resourceLocator',
  noDataExpression: false,
  default:          { mode: 'list', value: '' },
  modes: [
    {
      name:        'list',
      displayName: 'From list',
      type:        'list',
      placeholder: 'Choose a solution…',
      typeOptions: { searchListMethod: 'solutionSearch', searchable: true },
    },
    {
      name:        'id',
      displayName: 'By ID',
      type:        'string',
      placeholder: 'e.g. Solution ID',
    },
  ],
  description: 'Select the Solution',
};

/**
 * Re-usable “Table” input with Fixed | Expression toggle enabled.
 * Clears & reloads whenever `solutionId.value` changes.
 */
export const tableInput: INodeProperties = {
  displayName:      'Table',
  name:             'tableId',
  type:             'resourceLocator',
  noDataExpression: false,
  default:          { mode: 'list', value: '' },
  typeOptions:      { loadOptionsDependsOn: ['solutionId.value'] },
  modes: [
    {
      name:        'list',
      displayName: 'From list',
      type:        'list',
      placeholder: 'Choose a table…',
      typeOptions: { searchListMethod: 'tableSearch', searchable: true },
    },
    {
      name:        'id',
      displayName: 'By ID',
      type:        'string',
      placeholder: 'e.g. Table ID',
    },
  ],
  description: 'Select the Table',
};

/**
 * Re-usable “Fields” input for record-create/update operations.
 * Clears & reloads whenever `solutionId.value` or `tableId.value` changes.
 */
export const fieldsInput: INodeProperties = {
  displayName: 'Fields',
  name:        'fieldsUi',
  type:        'fixedCollection',
  placeholder: 'Add Field',
  typeOptions: { multipleValues: true },
  default:     { fieldsValues: [] },
  description: 'Add fields when creating or updating a record',
  options: [
    {
      name:        'fieldsValues',
      displayName: 'Field',
      values: [
        {
          displayName:      'Field',
          name:             'field',
          type:             'options',
          noDataExpression: true,
          typeOptions:      {
            loadOptionsMethod:    'searchTableFieldsMutable',
            loadOptionsDependsOn: ['solutionId.value', 'tableId.value'],
          },
          default:     '',
          placeholder: 'Choose a field…',
          description: 'Select a field to set',
        },
        {
          displayName: 'Value',
          name:        'value',
          type:        'json',
          default:     '',
          description: 'Value to assign to that field. Use a JSON array (e.g. ["id1","id2"]) for multi-value fields like LinkedRecord.',
        },
      ],
    },
  ],
};
