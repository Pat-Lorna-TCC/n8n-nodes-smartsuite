// src/nodes/SmartSuite/__tests__/actions/record/updateRecord.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as updateRecord } from '../../../actions/record/updateRecord.operation';
import { NodeOperationError } from 'n8n-workflow';
import * as utils from '../../../helpers/utils';
import * as validation from '../../../helpers/validation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs'; 

// Mock the validation helpers
jest.mock('../../../helpers/validation', () => ({
  getTableIdWithStructure: jest.fn().mockResolvedValue({ id: 'dummy-table-id', structure: [] }),
  getSolutionId: jest.fn().mockResolvedValue('dummy-solution-id'),
}));

// Mock the transport apiRequest function
jest.mock('../../../transport/smartSuiteApi', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '../../../transport/smartSuiteApi';

describe('SmartSuite – updateRecord Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    (apiRequest as jest.Mock).mockResolvedValue({});
  });

  it('should update a record and return API response', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {
        recordId: 'record-123',
        'fieldsUiUpdate.fieldsValues': [{ field: 'name', value: 'New Name' }],
      },
      apiRequestResponse: {},  // Ensure apiRequestResponse is included
      inputData: [{ json: {} }],  // Mocking input data
    });

    const result = await updateRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'PATCH',
      '/applications/dummy-table-id/records/record-123/',
      { name: 'New Name' },
    );
    expect(result).toEqual([{ json: {} }]);
  });

  it('should throw error if recordId is blank', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: { recordId: '  ' },
      apiRequestResponse: {},  // Ensure apiRequestResponse is included
      inputData: [{ json: {} }],
    });

    await expect(updateRecord.call(executeMock)).rejects.toThrow(
      'Record ID is required for Update Record operation.',
    );
    await expect(updateRecord.call(executeMock)).rejects.toThrow('Received: "  "');
  });

  it('should throw error if no fields provided', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: { recordId: 'record-123', 'fieldsUiUpdate.fieldsValues': [] },
      apiRequestResponse: {},  // Ensure apiRequestResponse is included
      inputData: [{ json: {} }],
    });

    await expect(updateRecord.call(executeMock)).rejects.toThrow(
      'You must provide at least one field to update a record.',
    );
  });

  it('should prevent updating reserved fields', async () => {
    jest.spyOn(utils, 'isReservedField').mockReturnValue(true);

    executeMock = createMockExecuteWithResources({
      parameters: {
        recordId: 'record-123',
        'fieldsUiUpdate.fieldsValues': [{ field: '_created_date', value: '2022-01-01' }],
      },
      apiRequestResponse: {},  // Ensure apiRequestResponse is included
      inputData: [{ json: {} }],
    });

    await expect(updateRecord.call(executeMock)).rejects.toThrow(
      'Cannot update system field “_created_date”.',
    );
  });

  it('should update multiple records correctly', async () => {
    jest.spyOn(utils, 'isReservedField').mockReturnValue(false);

    executeMock = createMockExecuteWithResources({
      parameters: {},
      apiRequestResponse: {},  // Ensure apiRequestResponse is included
      inputData: [{ json: {} }, { json: {} }],
    });

    const getNodeParameterMock = jest.spyOn(executeMock, 'getNodeParameter');
    getNodeParameterMock.mockImplementation((param, index) => {
      if (param === 'recordId') return `record-${index}`;
      if (param === 'fieldsUiUpdate.fieldsValues') {
        return [{ field: `custom_field_${index}`, value: `Value-${index}` }];
      }
    });

    const result = await updateRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledTimes(2);
    expect(apiRequest).toHaveBeenNthCalledWith(
      1,
      'PATCH',
      '/applications/dummy-table-id/records/record-0/',
      { custom_field_0: 'Value-0' },
    );
    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      'PATCH',
      '/applications/dummy-table-id/records/record-1/',
      { custom_field_1: 'Value-1' },
    );
    expect(result).toEqual([{ json: {} }, { json: {} }]);
  });

  it('should return empty array if no input items are provided', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {},
      inputData: [], // Mocking empty inputData
    });
    const result = await updateRecord.call(executeMock);
    expect(result).toEqual([]);
  });

  it('should slugify field names with spaces', async () => {
    jest.spyOn(utils, 'isReservedField').mockReturnValue(false);
    jest.spyOn(utils, 'asIdString').mockImplementation((val) => `${val}`.toLowerCase().replace(/\s+/g, '_'));

    executeMock = createMockExecuteWithResources({
      parameters: {
        recordId: 'abc123',
        'fieldsUiUpdate.fieldsValues': [{ field: 'Some Field', value: 'value' }],
      },
      apiRequestResponse: {},  // Ensure apiRequestResponse is included
      inputData: [{ json: {} }],
    });

    const result = await updateRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'PATCH',
      '/applications/dummy-table-id/records/abc123/',
      { some_field: 'value' },
    );
    expect(result).toEqual([{ json: {} }]);
  });

  it('should send an array when value is a JSON array string (LinkedRecord multi-value)', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {
        recordId: 'record-123',
        'fieldsUiUpdate.fieldsValues': [{ field: 'linked_records', value: '["id1","id2"]' }],
      },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    await updateRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'PATCH',
      '/applications/dummy-table-id/records/record-123/',
      { linked_records: ['id1', 'id2'] },
    );
  });

  it('should keep raw string when value is not valid JSON', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {
        recordId: 'record-123',
        'fieldsUiUpdate.fieldsValues': [{ field: 'title', value: 'plain text' }],
      },
      apiRequestResponse: {},
      inputData: [{ json: {} }],
    });

    await updateRecord.call(executeMock);

    expect(apiRequest).toHaveBeenCalledWith(
      'PATCH',
      '/applications/dummy-table-id/records/record-123/',
      { title: 'plain text' },
    );
  });

  it('should throw raw API error if apiRequest fails unexpectedly', async () => {
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error('API exploded'));
    jest.spyOn(utils, 'isReservedField').mockReturnValue(false);

    executeMock = createMockExecuteWithResources({
      parameters: {
        recordId: 'err123',
        'fieldsUiUpdate.fieldsValues': [{ field: 'field1', value: 'val1' }],
      },
      apiRequestResponse: {},  // Ensure apiRequestResponse is included
      inputData: [{ json: {} }],
    });

    await expect(updateRecord.call(executeMock)).rejects.toThrow('API exploded');
  });

  it('should resolve solutionId and tableId only once', async () => {
    const getSolutionIdSpy = jest.spyOn(validation, 'getSolutionId');
    const getTableIdWithStructureSpy = jest.spyOn(validation, 'getTableIdWithStructure');
    jest.spyOn(utils, 'isReservedField').mockReturnValue(false);

    executeMock = createMockExecuteWithResources({
      parameters: {},
      apiRequestResponse: {},  // Ensure apiRequestResponse is included
      inputData: [{ json: {} }],
    });

    const getNodeParam = jest.spyOn(executeMock, 'getNodeParameter');
    getNodeParam.mockImplementation((param, index) => {
      if (param === 'recordId') return `rec-${index}`;
      if (param === 'fieldsUiUpdate.fieldsValues') return [{ field: 'f', value: `v-${index}` }];
    });

    await updateRecord.call(executeMock);

    expect(getSolutionIdSpy).toHaveBeenCalledTimes(1);
    expect(getTableIdWithStructureSpy).toHaveBeenCalledTimes(1);
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
        parameters: {
          recordId: 'record-123',
          'fieldsUiUpdate.fieldsValues': [{ field: 'contact_name', value: 'John Doe' }],
        },
        apiRequestResponse: {},
        inputData: [{ json: {} }],
      });

      await updateRecord.call(executeMock);

      expect(apiRequest).toHaveBeenCalledWith(
        'PATCH',
        '/applications/dummy-table-id/records/record-123/',
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
        parameters: {
          recordId: 'record-123',
          'fieldsUiUpdate.fieldsValues': [{ field: 'contact_name', value: JSON.stringify(existingObj) }],
        },
        apiRequestResponse: {},
        inputData: [{ json: {} }],
      });

      await updateRecord.call(executeMock);

      expect(apiRequest).toHaveBeenCalledWith(
        'PATCH',
        '/applications/dummy-table-id/records/record-123/',
        { contact_name: existingObj },
      );
    });

    it('should not transform non-fullnamefield string fields', async () => {
      const { getTableIdWithStructure } = require('../../../helpers/validation');
      (getTableIdWithStructure as jest.Mock).mockResolvedValue({
        id: 'dummy-table-id',
        structure: [{ slug: 'title', label: 'Title', field_type: 'textfield' }],
      });

      executeMock = createMockExecuteWithResources({
        parameters: {
          recordId: 'record-123',
          'fieldsUiUpdate.fieldsValues': [{ field: 'title', value: 'John Doe' }],
        },
        apiRequestResponse: {},
        inputData: [{ json: {} }],
      });

      await updateRecord.call(executeMock);

      expect(apiRequest).toHaveBeenCalledWith(
        'PATCH',
        '/applications/dummy-table-id/records/record-123/',
        { title: 'John Doe' },
      );
    });
  });

  it('should include itemIndex in error when recordId is blank in one item', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {},
      inputData: [{ json: {} }, { json: {} }],
    });

    const getNodeParam = jest.spyOn(executeMock, 'getNodeParameter');
    getNodeParam.mockImplementation((param, index) => {
      if (param === 'recordId') return index === 1 ? ' ' : 'valid-id';
      if (param === 'fieldsUiUpdate.fieldsValues') return [{ field: 'f', value: 'v' }];
    });

    try {
      await updateRecord.call(executeMock);
    } catch (err: any) {
      expect(err).toBeInstanceOf(NodeOperationError);
      expect(err.context?.itemIndex).toBe(1);
    }
  });

  it('should include undefined in error message when recordId is undefined', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {},
      inputData: [{ json: {} }],
    });

    const getNodeParam = jest.spyOn(executeMock, 'getNodeParameter');
    getNodeParam.mockImplementation((param, index) => {
      if (param === 'recordId') return undefined;
      if (param === 'fieldsUiUpdate.fieldsValues') return [{ field: 'f', value: 'v' }];
      return undefined;
    });

    await expect(updateRecord.call(executeMock)).rejects.toThrow('Received: undefined');
  });
});
