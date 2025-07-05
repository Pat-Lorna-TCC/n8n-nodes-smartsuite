// src/nodes/SmartSuite/__tests__/actions/record/createRecord.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as createRecord } from '../../../actions/record/createRecord.operation';
import * as utils from '../../../helpers/utils';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs'; // Import the helper function

// Mock validation helpers
jest.mock('../../../helpers/validation', () => ({
  getSolutionId: jest.fn().mockResolvedValue('dummy-solution-id'),
  getTableId: jest.fn().mockResolvedValue('dummy-table-id'),
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

  it('should call getSolutionId and getTableId once per execution', async () => {
    const { getSolutionId, getTableId } = require('../../../helpers/validation');

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
    expect(getTableId).toHaveBeenCalledTimes(1);
  });
});
