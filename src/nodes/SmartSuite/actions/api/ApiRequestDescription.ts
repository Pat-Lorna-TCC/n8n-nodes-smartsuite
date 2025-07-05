// src/nodes/SmartSuite/actions/api/ApiRequestDescription.ts

import type { INodeProperties } from 'n8n-workflow';

/**
 * We locally extend INodeProperties so we can add the notice property
 * (n8n’s core INodeProperties type doesn’t include it).
 */
type ExtendedNodeProperties = Omit<INodeProperties, 'type'> & { type: string; notice?: string };

const apiRequestDescriptionExtended: ExtendedNodeProperties[] = [
  // 1) Choose HTTP method as the operation
  {
    displayName:      'Operation',
    name:             'operation',
    type:             'options',
    noDataExpression: true,
    displayOptions:   { show: { resource: ['apiRequest'] } },
    options: [
      { name: 'GET',    value: 'GET',    action: 'Get',    description: 'Send a GET request'    },
      { name: 'POST',   value: 'POST',   action: 'Post',   description: 'Send a POST request'   },
      { name: 'PUT',    value: 'PUT',    action: 'Put',    description: 'Send a PUT request'    },
      { name: 'PATCH',  value: 'PATCH',  action: 'Patch',  description: 'Send a PATCH request'  },
      { name: 'DELETE', value: 'DELETE', action: 'Delete', description: 'Send a DELETE request' },
    ],
    default:          'GET',
    description:      'The HTTP method to use for the request',
  },

  // 2) Notice shown above URL
  {
    displayName:    'Relative to app.smartsuite.com/api/v1',
    name:           'urlNotice',
    type:           'notice',
    default:        '',
    notice:         'Relative to app.smartsuite.com/api/v1',
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'] } },
  },

  // 3) URL
  { displayName: 'URL',
    name:        'url',
    type:        'string',
    default:     '/solutions/',
    placeholder: 'https://app.smartsuite.com/api/v1/solutions',
    description: 'Enter a path relative to <code>app.smartsuite.com/api/v1</code>. ‘SmartSuite REST API’ docs <a href="https://developers.smartsuite.com/docs/intro" target="_blank">here</a>.',
    required:    true,
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'] } },
  },

  // ── SEND QUERY PARAMETERS ────────────────────────────────────────────────────
  {
    displayName: 'Send Query Parameters',
    name:        'sendQuery',
    type:        'boolean',
    default:     false,
    description: 'Whether to add URL query parameters',
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'] } },
  },
  {
    displayName: 'Specify Query Parameters',
    name:        'specifyQuery',
    type:        'options',
    options: [
      { name: 'Using Fields Below', value: 'fields' },
      { name: 'Using JSON',         value: 'json'   },
    ],
    default:     'fields',
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'], sendQuery: [true] } },
  },
  {
    displayName: 'Query Parameters',
    name:        'queryParameters',
    type:        'fixedCollection',
    typeOptions: { multipleValues: true, addButtonText: 'Add Parameter' },
    placeholder: 'Add Parameter',
    default:     { parameter: [ { name: '', value: '' } ] },
    options: [
      {
        name:        'parameter',
        displayName: 'Parameter',
        values: [
          { displayName: 'Name',  name: 'name',  type: 'string', default: '' },
          { displayName: 'Value', name: 'value', type: 'string', default: '' },
        ],
      },
    ],
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'], sendQuery: [true], specifyQuery: ['fields'] } },
  },
  {
    displayName: 'Query Parameters (JSON)',
    name:        'jsonQuery',
    type:        'json',
    default:     '',
    description: 'Raw JSON for query parameters',
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'], sendQuery: [true], specifyQuery: ['json'] } },
  },

  // ── SEND HEADERS ────────────────────────────────────────────────────────────
  {
    displayName: 'Send Headers',
    name:        'sendHeaders',
    type:        'boolean',
    default:     false,
    description: 'Whether to add HTTP headers',
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'] } },
  },
  {
    displayName: 'Specify Headers',
    name:        'specifyHeaders',
    type:        'options',
    options: [
      { name: 'Using Fields Below', value: 'fields' },
      { name: 'Using JSON',         value: 'json'   },
    ],
    default:     'fields',
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'], sendHeaders: [true] } },
  },
  {
    displayName: 'Header Parameters',
    name:        'headerParameters',
    type:        'fixedCollection',
    typeOptions: { multipleValues: true, addButtonText: 'Add Parameter' },
    placeholder: 'Add Parameter',
    default:     { parameter: [ { name: '', value: '' } ] },
    options: [
      {
        name:        'parameter',
        displayName: 'Header',
        values: [
          { displayName: 'Name',  name: 'name',  type: 'string', default: '' },
          { displayName: 'Value', name: 'value', type: 'string', default: '' },
        ],
      },
    ],
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'], sendHeaders: [true], specifyHeaders: ['fields'] } },
  },
  {
    displayName: 'Headers (JSON)',
    name:        'jsonHeaders',
    type:        'json',
    default:     '',
    description: 'Raw JSON for headers',
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'], sendHeaders: [true], specifyHeaders: ['json'] } },
  },

  // ── SEND BODY ───────────────────────────────────────────────────────────────
  {
    displayName: 'Send Body',
    name:        'sendBody',
    type:        'boolean',
    default:     false,
    description: 'Whether to include a request body',
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'] } },
  },
  {
    displayName: 'Specify Body',
    name:        'specifyBody',
    type:        'options',
    options: [
      { name: 'Using Fields Below', value: 'fields' },
      { name: 'Using JSON',         value: 'json'   },
    ],
    default:     'fields',
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'], sendBody: [true] } },
  },
  {
    displayName: 'Body Parameters',
    name:        'bodyParameters',
    type:        'fixedCollection',
    typeOptions: { multipleValues: true, addButtonText: 'Add Parameter' },
    placeholder: 'Add Parameter',
    default:     { parameter: [ { name: '', value: '' } ] },
    options: [
      {
        name:        'parameter',
        displayName: 'Field',
        values: [
          { displayName: 'Name',  name: 'name',  type: 'string', default: '' },
          { displayName: 'Value', name: 'value', type: 'string', default: '' },
        ],
      },
    ],
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'], sendBody: [true], specifyBody: ['fields'] } },
  },
  {
    displayName: 'Body (JSON)',
    name:        'jsonBody',
    type:        'json',
    default:     '',
    description: 'Raw JSON payload',
    displayOptions: { show: { resource: ['apiRequest'], operation: ['GET','POST','PUT','PATCH','DELETE'], sendBody: [true], specifyBody: ['json'] } },
  },
];

export const apiRequestDescription = apiRequestDescriptionExtended as unknown as INodeProperties[];
