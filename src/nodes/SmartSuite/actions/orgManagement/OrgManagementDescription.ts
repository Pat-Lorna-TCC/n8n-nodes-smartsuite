// src/nodes/SmartSuite/actions/orgManagement/OrgManagementDescription.ts
import type { INodeProperties } from 'n8n-workflow';

export const orgManagementDescription: INodeProperties[] = [
  {
    displayName:      'Operation',
    name:             'operation',
    type:             'options',
    noDataExpression: true,
    displayOptions:   { show: { resource: ['orgManagement'] } },
    options: [
      { name: 'Get Current User', value: 'getCurrentUser', action: 'Get Current User', description: 'Retrieve the currently authenticated user' },
      { name: 'List Members',      value: 'listMembers',      action: 'List Members',      description: 'List all members in the organization' },
      { name: 'List Teams',        value: 'listTeams',        action: 'List Teams',        description: 'List all teams in the organization' },
    ],
    default:          'getCurrentUser',
    description:      'Which Org Management operation to perform',
  },
  // (no additional fields needed here)
];
