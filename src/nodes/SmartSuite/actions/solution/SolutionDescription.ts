// src/nodes/SmartSuite/actions/solution/SolutionDescription.ts

import type { INodeProperties } from 'n8n-workflow';
import { solutionInput } from '../../shared/resourceInputs';

export const solutionDescription: INodeProperties[] = [
  {
    displayName:      'Operation',
    name:             'operation',
    type:             'options',
    noDataExpression: true,
    displayOptions:   { show: { resource: ['solution'] } },
    options: [
      { name: 'List Solutions', value: 'listSolution', action: 'List Solutions', description: 'List all solutions' },
      { name: 'Get Solution',   value: 'getSolution',  action: 'Get Solution',   description: 'Retrieve a solution by ID' },
    ],
    default:     'listSolution',
    description: 'The operation to perform on a Solution',
  },
  // List Solutions fields
  {
    displayName: 'Return All',
    name:        'returnAll',
    type:        'boolean',
    default:     false,
    description: 'Return all solutions (paginated)',
    displayOptions: {
      show: { resource: ['solution'], operation: ['listSolution'] },
    },
  },
  {
    displayName: 'Limit',
    name:        'limit',
    type:        'number',
    default:     50,
    typeOptions: { minValue: 1, maxValue: 1000 },
    description: 'Max number of results to return',
    displayOptions: {
      show: {
        resource:   ['solution'],
        operation:  ['listSolution'],
        returnAll:  [false],
      },
    },
  },
  // Get Solution field
  {
    ...solutionInput,
    required: true,
    displayOptions: { show: { resource: ['solution'], operation: ['getSolution'] } },
    description: 'ID of the solution to retrieve',
  },
];
