// src/nodes/SmartSuite/actions/table/TableDescription.ts

import type { INodeProperties } from 'n8n-workflow';
import { solutionInput, tableInput } from '../../shared/resourceInputs';

/**
 * Table operations and fields for SmartSuite node
 */
export const tableOperations: INodeProperties[] = [
  {
    displayName:      'Operation',
    name:             'operation',
    type:             'options',
    noDataExpression: true,
    displayOptions:   { show: { resource: ['table'] } },
    options: [
      { name: 'List Tables',        value: 'listTable',        action: 'List Tables'        },
      { name: 'Get Table',          value: 'getTable',         action: 'Get Table'          },
      { name: 'Create Table Field', value: 'createTableField', action: 'Create Table Field' },
      { name: 'Create Table',       value: 'createTable',      action: 'Create Table'       },
    ],
    default:     'listTable',
    description: 'The operation to perform',
  },
];

export const tableFields: INodeProperties[] = [
  // Solution selector
  {
    ...solutionInput,
    required: true,
    displayOptions: {
      show: {
        resource: ['table'],
        operation: ['listTable', 'getTable', 'createTableField', 'createTable'],
      },
    },
  },

  // List Tables
  {
    displayName: 'Return All',
    name:        'returnAll',
    type:        'boolean',
    default:     false,
    displayOptions: { show: { resource: ['table'], operation: ['listTable'] } },
    description: 'Return all tables (ignore Limit)',
  },
  {
    displayName: 'Limit',
    name:        'limit',
    type:        'number',
    default:     50,
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: ['table'], operation: ['listTable'], returnAll: [false] },
    },
    description: 'Maximum number of tables to return when not returning all',
  },

  // Get Table
  {
    ...tableInput,
    required: true,
    displayOptions: { show: { resource: ['table'], operation: ['getTable'] } },
  },

  // Create Table Field
  {
    ...tableInput,
    required: true,
    displayOptions: { show: { resource: ['table'], operation: ['createTableField'] } },
  },
  {
    displayName: 'Field Name',
    name:        'fieldName',
    type:        'string',
    default:     '',
    required:    true,
    displayOptions: { show: { resource: ['table'], operation: ['createTableField'] } },
    description: 'The name of the field',
  },
  {
    displayName: 'Field Type',
    name:        'fieldType',
    type:        'options',
    options: [
      { name: 'Text',              value: 'textfield' },
      { name: 'Text Area',         value: 'textareafield' },
      { name: 'Single Select',     value: 'singleselectfield' },
      { name: 'Multiple Select',   value: 'multipleselectfield' },
      { name: 'Number',            value: 'numberfield' },
      { name: 'Date',              value: 'datefield' },
      { name: 'Due Date',          value: 'duedatefield' },
      { name: 'Address',           value: 'addressfield' },
      { name: 'Assigned To',       value: 'assignedtofield' },
      { name: 'Checklist',         value: 'checklistfield' },
      { name: 'Email',             value: 'emailfield' },
      { name: 'Files & Images',    value: 'filesimagesfield' },
      { name: 'Formula',           value: 'formulafield' },
      { name: 'Full Name',         value: 'fullnamefield' },
      { name: 'Linked Record',     value: 'linkedrecordfield' },
      { name: 'Lookup',            value: 'lookupfield' },
      { name: 'Phone',             value: 'phonefield' },
      { name: 'Rating',            value: 'ratingfield' },
      { name: 'Record ID',         value: 'recordidfield' },
      { name: 'Rollup',            value: 'rollupfield' },
      { name: 'Signature',         value: 'signaturefield' },
      { name: 'SmartDoc',          value: 'smartdocfield' },
      { name: 'Social Networks',   value: 'socialnetworksfield' },
      { name: 'Status',            value: 'statusfield' },
      { name: 'Sub Items',         value: 'subitemsfield' },
      { name: 'Tag',               value: 'tagfield' },
      { name: 'Time',              value: 'timefield' },
      { name: 'Vote',              value: 'votefield' },
      { name: 'Yes/No',            value: 'yesnofield' },
    ],
    default: 'textfield',
    displayOptions: { show: { resource: ['table'], operation: ['createTableField'] } },
    description: 'The type of the new field',
  },
  {
    displayName: 'Help Text',
    name:        'helpText',
    type:        'string',
    default:     '',
    displayOptions: { show: { resource: ['table'], operation: ['createTableField'] } },
    description: 'Help text for the field',
  },

  // Create Table
  {
    displayName: 'Table Name',
    name:        'tableName',
    type:        'string',
    required:    true,
    default:     '',
    displayOptions: { show: { resource: ['table'], operation: ['createTable'] } },
    description: 'API name for the new table (unique, no spaces)',
  },
  {
    displayName: 'Table Description',
    name:        'tableDescription',
    type:        'string',
    default:     '',
    displayOptions: { show: { resource: ['table'], operation: ['createTable'] } },
    description: 'Optional description for the new table',
  },
  {
    displayName: 'Icon',
    name:        'icon',
    type:        'string',
    default:     'table',
    displayOptions: { show: { resource: ['table'], operation: ['createTable'] } },
    description: 'Icon for the new table',
  },
];
