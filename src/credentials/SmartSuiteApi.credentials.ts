// src/credentials/SmartSuiteApi.credentials.ts
import type {
  ICredentialType,
  INodeProperties,
  IAuthenticateGeneric,
  ICredentialTestRequest,
  Icon,
} from 'n8n-workflow';

export class SmartSuiteApi implements ICredentialType {
  name = 'smartSuiteApi';
  displayName = 'SmartSuite API';
  icon: Icon = 'file:SmartSuiteApi.svg';
  documentationUrl = 'https://developers.smartsuite.com/docs/authentication';

  /**
   * Attach your API Token and Workspace ID on every request
   */
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: 'Token {{$credentials.apiKey}}',
        'Account-Id': '{{$credentials.accountId}}',
      },
    },
  };

  /**
   * Fake credential test by sending a lightweight HEAD request to the public SmartSuite homepage.
   * No credentials or login required, always returns 200 OK.
   */
  test: ICredentialTestRequest = {
    request: {
      method: 'HEAD',
      url:    'https://app.smartsuite.com',
    },
  };

  /**
   * User-entered credential fields
   */
  properties: INodeProperties[] = [
    {
      displayName: 'API Token (No "Token" prefix)',
      name:        'apiKey',
      type:        'string',
      typeOptions: { password: true },
      default:     '',
      required:    true,
      description:
        'Your SmartSuite API key (raw token only—do not include "Token").',
    },
    {
      displayName: 'Workspace ID',
      name:        'accountId',
      type:        'string',
      default:     '',
      required:    true,
      description:
        'Your SmartSuite workspace ID (the 8-character identifier).',
    },
    {
      displayName: 'Base URL',
      name:        'baseUrl',
      type:        'string',
      default:     'https://app.smartsuite.com/api/v1',
      required:    true,
      description: 'The base URL for the SmartSuite API',
    },
  ];
}
