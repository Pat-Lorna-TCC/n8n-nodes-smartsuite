// src/nodes/SmartSuite/actions/record/RecordDescription.ts
import type { INodeProperties } from 'n8n-workflow';
import { solutionInput, tableInput } from '../../shared/resourceInputs';

export const recordDescription: INodeProperties[] = [
  // 1) Operation Selector
  {
    displayName:      'Operation',
    name:             'operation',
    type:             'options',
    noDataExpression: true,
    displayOptions:   { show: { resource: ['record'] } },
    options: [
      { name: 'Get Record',     value: 'getRecord',    action: 'Get Record',     description: 'Retrieve a record by ID' },
      { name: 'List Records',   value: 'listRecord',   action: 'List Records',   description: 'List multiple records' },
      { name: 'Search Records', value: 'searchRecord', action: 'Search Records', description: 'Search for records' },
      { name: 'Create Record',  value: 'createRecord',  action: 'Create Record',  description: 'Create a new record' },
      { name: 'Update Record',  value: 'updateRecord',  action: 'Update Record',  description: 'Update an existing record' },
      { name: 'Upsert Record',  value: 'upsertRecord',  action: 'Upsert Record',  description: 'Create a record or update it if it already exists' },
      { name: 'Delete Record',  value: 'deleteRecord',  action: 'Delete Record',  description: 'Delete a record' },
    ],
    default: 'getRecord',
    description: 'The operation to perform on a Record',
  },

  // 2) Solution Selector
  {
    ...solutionInput,
    required: true,
    displayOptions: {
      show: {
        resource: ['record'],
        operation: ['getRecord','listRecord','searchRecord','createRecord','updateRecord','upsertRecord','deleteRecord'],
      },
    },
  },

  // 3) Table Selector
  {
    ...tableInput,
    required: true,
    displayOptions: {
      show: {
        resource: ['record'],
        operation: ['getRecord','listRecord','searchRecord','createRecord','updateRecord','upsertRecord','deleteRecord'],
      },
    },
  },

  // 4) Get Record
  {
    displayName:    'Record ID',
    name:           'recordId',
    type:           'string',
    required:       true,
    noDataExpression: false,
    default:        '',
    displayOptions: { show: { resource: ['record'], operation: ['getRecord'] } },
    description:    'The SmartSuite Record ID to retrieve',
  },
  {
    displayName:      'Hydrated',
    name:             'hydrated',
    type:             'boolean',
    noDataExpression: true,
    default:          false,
    displayOptions:   { show: { resource: ['record'], operation: ['getRecord'] } },
    description:      'Return record with related data hydrated',
  },

  // 5) List Records
  {
    displayName:      'Hydrated',
    name:             'hydrated',
    type:             'boolean',
    noDataExpression: true,
    default:          false,
    displayOptions:   { show: { resource: ['record'], operation: ['listRecord'] } },
    description:      'Return records with related data hydrated',
  },
  {
    displayName:      'Return All',
    name:             'returnAll',
    type:             'boolean',
    noDataExpression: true,
    default:          false,
    displayOptions:   { show: { resource: ['record'], operation: ['listRecord'] } },
    description:      'Return all records (ignores limit)',
  },
  {
    displayName:    'Limit',
    name:           'limit',
    type:           'number',
    noDataExpression: true,
    default:        50,
    typeOptions:    { minValue: 1, maxValue: 100 },
    displayOptions: { show: { resource: ['record'], operation: ['listRecord'], returnAll: [false] } },
    description:    'Max number of records to return',
  },

  // 6) Search Records
  {
    displayName:      'Search Operator',
    name:             'searchOperator',
    type:             'options',
    noDataExpression: true,
    default:          'AND',
    options: [
      { name: 'AND', value: 'AND' },
      { name: 'OR',  value: 'OR'  },
    ],
    displayOptions:   { show: { resource: ['record'], operation: ['searchRecord'] } },
    description:      'Combine filters (AND/OR)',
  },
  {
    displayName:    'Filters',
    name:           'filters',
    type:           'fixedCollection',
    placeholder:    'Add Filter',
    typeOptions:    { multipleValues: true, valueMultiple: 'filter', sortable: true },
    default:        { filter: [] },
    noDataExpression: true,
    displayOptions: { show: { resource: ['record'], operation: ['searchRecord'] } },
    description:    'List of filters to apply',
    options: [
      {
        displayName: 'Filter Criteria',
        name:        'filter',
        values: [
          {
            displayName:      'Field',
            name:             'field',
            type:             'options',
            noDataExpression: true,
            typeOptions:      {
              loadOptionsMethod:    'searchTableFields',
              loadOptionsDependsOn: ['solutionId.value','tableId.value'],
            },
            default:     '',
            description: 'Select a field to filter on',
          },
          {
            displayName:      'Condition',
            name:             'condition',
            type:             'options',
            noDataExpression: true,
            default:           '',
            typeOptions:      {
              loadOptionsMethod:    'getFilterOptionsForFieldType',
              loadOptionsDependsOn: ['filters.filter[0].field'],
            },
            description: 'Comparison operator. <a href="https://developers.smartsuite.com/docs/solution-data/records/sort-filter#operators-by-field-type" target="_blank">See SmartSuite operators</a>',
          },
          {
            displayName: 'Value',
            name:        'value',
            type:        'string',
            default:     '',
            description: 'Value to compare against',
          },
        ],
      },
    ],
  },
  {
    displayName:      'Hydrated',
    name:             'hydrated',
    type:             'boolean',
    noDataExpression: true,
    default:          false,
    displayOptions:   { show: { resource: ['record'], operation: ['searchRecord'] } },
    description:      'Return hydrated records',
  },
  {
    displayName:      'Return All',
    name:             'returnAll',
    type:             'boolean',
    noDataExpression: true,
    default:          false,
    displayOptions:   { show: { resource: ['record'], operation: ['searchRecord'] } },
    description:      'Ignore limit and return all matching records',
  },
  {
    displayName:    'Limit',
    name:           'limit',
    type:           'number',
    noDataExpression: true,
    default:        50,
    typeOptions:    { minValue: 1, maxValue: 100 },
    displayOptions: { show: { resource: ['record'], operation: ['searchRecord'], returnAll: [false] } },
    description:    'Max number of records to return',
  },

  // 7) Create Record
  {
    displayName:      'Fields',
    name:             'fieldsUi',
    type:             'fixedCollection',
    placeholder:      'Add Field',
    typeOptions:      { multipleValues: true, sortable: true },
    default:          { fieldsValues: [] },
    noDataExpression: true,
    displayOptions:   { show: { resource: ['record'], operation: ['createRecord'] } },
    description:      'Add fields when creating a record',
    options: [
      {
        displayName: 'Field to Set',
        name:        'fieldsValues',
        values: [
          {
            displayName:      'Field',
            name:             'field',
            type:             'options',
            noDataExpression: true,
            typeOptions:      {
              loadOptionsMethod:    'searchTableFieldsMutable',
              loadOptionsDependsOn: ['solutionId.value','tableId.value'],
            },
            default:     '',
            description: 'Select a field',
          },
          {
            displayName: 'Value',
            name:        'value',
            type:        'string',
            default:     '',
            description: 'Value to assign to that field',
          },
        ],
      },
    ],
  },

  // 8) Update Record
  {
    displayName:      'Record ID',
    name:             'recordId',
    type:             'string',
    required:         true,
    noDataExpression: false,
    default:          '',
    displayOptions:   { show: { resource: ['record'], operation: ['updateRecord'] } },
    description:      'The SmartSuite Record ID to update',
  },
  {
    displayName:      'Fields to Update',
    name:             'fieldsUiUpdate',
    type:             'fixedCollection',
    placeholder:      'Add Field',
    typeOptions:      { multipleValues: true, sortable: true },
    default:          { fieldsValues: [] },
    noDataExpression: true,
    displayOptions:   { show: { resource: ['record'], operation: ['updateRecord'] } },
    description:      'Add fields when updating a record',
    options: [
      {
        displayName: 'Field to Update',
        name:        'fieldsValues',
        values: [
          {
            displayName:      'Field',
            name:             'field',
            type:             'options',
            noDataExpression: true,
            typeOptions:      {
              loadOptionsMethod:    'searchTableFieldsMutable',
              loadOptionsDependsOn: ['solutionId.value','tableId.value'],
            },
            default:     '',
            description: 'Select a field to update',
          },
          {
            displayName: 'Value',
            name:        'value',
            type:        'string',
            default:     '',
            description: 'Value to assign to that field',
          },
        ],
      },
    ],
  },

  // 9) Upsert Record Warning
  {
    displayName: '⚠️ Upsert Warning: If your “contains” filter matches multiple records, only the first match will be updated.',
    name:        'noticeUpsertWarning',
    type:        'notice',
    default:     '',
    displayOptions: {
      show: { resource: ['record'], operation: ['upsertRecord'] },
    },
  },
  {
    displayName:      'Matching Field',
    name:             'matchingField',
    type:             'options',
    noDataExpression: true,
    typeOptions:      {
      loadOptionsMethod:    'searchTableFieldsMutable',
      loadOptionsDependsOn: ['solutionId.value','tableId.value'],
    },
    displayOptions:   { show: { resource: ['record'], operation: ['upsertRecord'] } },
    description:      'Field to match on for upserting',
    default:          '',
  },
  {
    displayName:      'Condition',
    name:             'condition',
    type:             'options',
    noDataExpression: true,
    default:           '',
    typeOptions:      {
      loadOptionsMethod:    'getFilterOptionsForFieldType',
      loadOptionsDependsOn: ['matchingField'],
    },
    displayOptions:   { show: { resource: ['record'], operation: ['upsertRecord'] } },
    description:      'Comparison operator. <a href="https://developers.smartsuite.com/docs/solution-data/records/sort-filter#operators-by-field-type" target="_blank">See SmartSuite operators</a>.',
  },
  {
    displayName: 'Match Value',
    name:        'matchValue',
    type:        'string',
    noDataExpression: false,
    default:     '',
    displayOptions: { show: { resource: ['record'], operation: ['upsertRecord'] } },
    description: 'Value to match against in the field',
  },
  {
    displayName:      'Fields to Upsert',
    name:             'fieldsUiUpdate',
    type:             'fixedCollection',
    placeholder:      'Add Field',
    typeOptions:      { multipleValues: true, sortable: true },
    default:          { fieldsValues: [] },
    noDataExpression: true,
    displayOptions:   { show: { resource: ['record'], operation: ['upsertRecord'] } },
    description:      'Add fields when upserting a record',
    options: [
      {
        displayName: 'Field to Upsert',
        name:        'fieldsValues',
        values: [
          {
            displayName:      'Field',
            name:             'field',
            type:             'options',
            noDataExpression: true,
            typeOptions:      {
              loadOptionsMethod:    'searchTableFieldsMutable',
              loadOptionsDependsOn: ['solutionId.value','tableId.value'],
            },
            default:     '',
            description: 'Select a field to upsert',
          },
          {
            displayName: 'Value',
            name:        'value',
            type:        'string',
            default:     '',
            description: 'Value to assign to that field',
          },
        ],
      },
    ],
  },

  // 10) Delete Record
  {
    displayName:      'Record ID',
    name:             'recordId',
    type:             'string',
    required:         true,
    noDataExpression: false,
    default:          '',
    displayOptions:   { show: { resource: ['record'], operation: ['deleteRecord'] } },
    description:      'The SmartSuite Record ID to delete',
  },
];
