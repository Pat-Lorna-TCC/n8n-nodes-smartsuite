// src/credentials/SmartSuiteApi.credentials.ts
import type {
  ICredentialType,
  INodeProperties,
  IAuthenticateGeneric,
  Icon,
} from 'n8n-workflow';

export class SmartSuiteApi implements ICredentialType {
  name = 'smartSuiteApi';
  displayName = 'SmartSuite API';
  icon: Icon = 'file:SmartSuiteApi.svg';
  documentationUrl = 'https://developers.smartsuite.com/docs/authentication';

  // ← add **this** back
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: 'Token {{$credentials.apiKey}}',
        'Account-Id': '{{$credentials.accountId}}',
      },
    },
  };

  properties: INodeProperties[] = [
    {
      displayName: 'API Token (No "Token” prefix)',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'Your SmartSuite API key (raw token only—do not include “Token”).',
    },
    {
      displayName: 'Workspace ID',
      name: 'accountId',
      type: 'string',
      default: '',
      required: true,
      description:
        'Your SmartSuite workspace ID (the 8-character identifier).',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://app.smartsuite.com/api/v1',
      required: true,
      description: 'The base URL for the SmartSuite API',
    },
  ];
}
