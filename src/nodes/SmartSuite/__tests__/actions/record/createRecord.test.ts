// src/nodes/SmartSuite/__tests__/actions/record/createRecord.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as createRecord } from '../../../actions/record/createRecord.operation';
import * as utils from '../../../helpers/utils';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs'; // Import the helper function

// Mock validation helpers
jest.mock('../../../helpers/validation', () => ({
  getSolutionId: jest.fn().mockResolvedValue('dummy-solution-id'),
  getTableIdWithStructure: jest.fn().mockResolvedValue({ id: 'dummy-table-id', structure: [] }),
}));

// Mock transport apiRequest
jest.mock('../../../transport/smartSuiteApi', () => ({
  apiRequest: jest.fn().mockResolvedValue({ id: 'record-id', foo: 'bar' }),
}));

import { apiRequest } from '../../../transport/smartSuiteApi';

describe('SmartSuite – createRecord Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call apiRequest with correct args and return the created record', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {
        'fieldsUi': {
          fieldsValues: [{ field: 'Field1', value: 'Value1' }],
        },
      },
      apiRequestResponse: { id: 'record-id', foo: 'bar' },
      inputData: [{ json: {} }],
    });

    const result = await createRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/applications/dummy-table-id/records/',
      { [utils.asIdString('Field1')]: 'Value1' },
    );
    expect(result).toEqual([{ json: { id: 'record-id', foo: 'bar' } }]);
  });

  it('should throw error if no fields provided', async () => {
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: [{ json: {} }],
      parameters: {
        'fieldsUi': {
          fieldsValues: [],
        },
      },
    });

    await expect(createRecord.call(executeMock)).rejects.toThrow(
      'You must provide at least one field to create a record.',
    );
  });

  it('should throw error for reserved field', async () => {
    const isReservedSpy = jest.spyOn(utils, 'isReservedField').mockReturnValue(true);

    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: [{ json: {} }],
      parameters: {
        'fieldsUi': {
          fieldsValues: [{ field: 'AnyField', value: 'Val' }],
        },
      },
    });

    await expect(createRecord.call(executeMock)).rejects.toThrow(/Cannot set system field/);

    isReservedSpy.mockRestore();
  });

  it('should process multiple items correctly', async () => {
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: { id: 'record-id', foo: 'bar' },
      inputData: [{ json: {} }, { json: {} }],
      parameters: {
        'fieldsUi': {
          fieldsValues: [{ field: 'FieldA', value: 'A' }],
        },
      },
    });

    const result = await createRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('should slugify field names in payload', async () => {
    const asIdSpy = jest.spyOn(utils, 'asIdString').mockImplementation((input: unknown) => {
      const val = String(input);
      return val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    });

    executeMock = createMockExecuteWithResources({
      apiRequestResponse: { id: 'record-id' },
      inputData: [{ json: {} }],
      parameters: {
        'fieldsUi': {
          fieldsValues: [{ field: 'My Field', value: 'Val' }],
        },
      },
    });

    await createRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/applications/dummy-table-id/records/',
      { my_field: 'Val' },
    );

    asIdSpy.mockRestore();
  });

  it('should wrap non-object response as empty object', async () => {
    (apiRequest as jest.Mock).mockResolvedValue('not-an-object');

    executeMock = createMockExecuteWithResources({
      apiRequestResponse: 'not-an-object',
      inputData: [{ json: {} }],
      parameters: {
        'fieldsUi': {
          fieldsValues: [{ field: 'FieldX', value: 'X' }],
        },
      },
    });

    const result = await createRecord.call(executeMock);
    expect(result).toEqual([{ json: {} }]);
  });

  it('should build payload for multiple fields in a single item', async () => {
    const fieldsValues = [
      { field: 'Field1', value: 'V1' },
      { field: 'Field2', value: 'V2' },
    ];
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: { id: 'record-id' },
      inputData: [{ json: {} }],
      parameters: {
        'fieldsUi': {
          fieldsValues: fieldsValues,
        },
      },
    });

    await createRecord.call(executeMock);

    const expectedPayload = Object.fromEntries(
      fieldsValues.map(({ field, value }) => [utils.asIdString(field), value]),
    );

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/applications/dummy-table-id/records/',
      expectedPayload,
    );
  });

  it('should send an array when value is a JSON array string (LinkedRecord multi-value)', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {
        'fieldsUi': {
          fieldsValues: [{ field: 'linked_records', value: '["id1","id2"]' }],
        },
      },
      apiRequestResponse: { id: 'record-id' },
      inputData: [{ json: {} }],
    });

    await createRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/applications/dummy-table-id/records/',
      { linked_records: ['id1', 'id2'] },
    );
  });

  it('should keep raw string when value is not valid JSON', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {
        'fieldsUi': {
          fieldsValues: [{ field: 'title', value: 'plain text' }],
        },
      },
      apiRequestResponse: { id: 'record-id' },
      inputData: [{ json: {} }],
    });

    await createRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/applications/dummy-table-id/records/',
      { title: 'plain text' },
    );
  });

  it('should pass through a non-string value (already parsed array) unchanged', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {
        'fieldsUi': {
          fieldsValues: [{ field: 'linked_records', value: ['id1', 'id2'] }],
        },
      },
      apiRequestResponse: { id: 'record-id' },
      inputData: [{ json: {} }],
    });

    await createRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/applications/dummy-table-id/records/',
      { linked_records: ['id1', 'id2'] },
    );
  });

  it('should call getSolutionId and getTableIdWithStructure once per execution', async () => {
    const { getSolutionId, getTableIdWithStructure } = require('../../../helpers/validation');

    executeMock = createMockExecuteWithResources({
      apiRequestResponse: { id: 'record-id' },
      inputData: [{ json: {} }],
      parameters: {
        'fieldsUi': {
          fieldsValues: [{ field: 'Field1', value: 'Value1' }],
        },
      },
    });

    await createRecord.call(executeMock);

    expect(getSolutionId).toHaveBeenCalledTimes(1);
    expect(getTableIdWithStructure).toHaveBeenCalledTimes(1);
  });

  describe('fullnamefield transformation', () => {
    beforeEach(() => {
      const { getTableIdWithStructure } = require('../../../helpers/validation');
      (getTableIdWithStructure as jest.Mock).mockResolvedValue({
        id: 'dummy-table-id',
        structure: [{ slug: 'contact_name', label: 'Contact Name', field_type: 'fullnamefield' }],
      });
    });

    it('should transform a "First Last" string to a fullname object', async () => {
      executeMock = createMockExecuteWithResources({
        parameters: { 'fieldsUi': { fieldsValues: [{ field: 'contact_name', value: 'John Doe' }] } },
        apiRequestResponse: { id: 'record-id' },
        inputData: [{ json: {} }],
      });

      await createRecord.call(executeMock);

      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/applications/dummy-table-id/records/',
        {
          contact_name: {
            sys_root: 'John Doe',
            salutation: '',
            first_name: 'John',
            middle_name: '',
            last_name: 'Doe',
            suffix: '',
          },
        },
      );
    });

    it('should pass through an already-object fullname value unchanged', async () => {
      const existingObj = {
        sys_root: 'John Doe',
        salutation: '',
        first_name: 'John',
        middle_name: '',
        last_name: 'Doe',
        suffix: '',
      };
      executeMock = createMockExecuteWithResources({
        parameters: { 'fieldsUi': { fieldsValues: [{ field: 'contact_name', value: JSON.stringify(existingObj) }] } },
        apiRequestResponse: { id: 'record-id' },
        inputData: [{ json: {} }],
      });

      await createRecord.call(executeMock);

      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/applications/dummy-table-id/records/',
        { contact_name: existingObj },
      );
    });

    it('should handle three-part names with middle name', async () => {
      executeMock = createMockExecuteWithResources({
        parameters: { 'fieldsUi': { fieldsValues: [{ field: 'contact_name', value: 'Mary Jane Watson' }] } },
        apiRequestResponse: { id: 'record-id' },
        inputData: [{ json: {} }],
      });

      await createRecord.call(executeMock);

      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/applications/dummy-table-id/records/',
        {
          contact_name: {
            sys_root: 'Mary Jane Watson',
            salutation: '',
            first_name: 'Mary',
            middle_name: 'Jane',
            last_name: 'Watson',
            suffix: '',
          },
        },
      );
    });

    it('should not transform non-fullnamefield string fields', async () => {
      const { getTableIdWithStructure } = require('../../../helpers/validation');
      (getTableIdWithStructure as jest.Mock).mockResolvedValue({
        id: 'dummy-table-id',
        structure: [{ slug: 'title', label: 'Title', field_type: 'textfield' }],
      });

      executeMock = createMockExecuteWithResources({
        parameters: { 'fieldsUi': { fieldsValues: [{ field: 'title', value: 'John Doe' }] } },
        apiRequestResponse: { id: 'record-id' },
        inputData: [{ json: {} }],
      });

      await createRecord.call(executeMock);

      expect(apiRequest).toHaveBeenCalledWith(
        'POST',
        '/applications/dummy-table-id/records/',
        { title: 'John Doe' },
      );
    });
  });
});
