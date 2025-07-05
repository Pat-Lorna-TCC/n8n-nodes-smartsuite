// src/credentials/SmartSuiteApi.credentials.ts
import type {
  ICredentialType,
  INodeProperties,
  Icon,
} from 'n8n-workflow';

export class SmartSuiteApi implements ICredentialType {
  name = 'smartSuiteApi';
  displayName = 'SmartSuite API';
  icon: Icon = 'file:SmartSuiteApi.svg';
  documentationUrl = 'https://developers.smartsuite.com/docs/authentication';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your SmartSuite API key',
    },
    {
      displayName: 'Account ID',
      name: 'accountId',
      type: 'string',
      default: '',
      required: true,
      description: 'Your SmartSuite Account ID',
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
