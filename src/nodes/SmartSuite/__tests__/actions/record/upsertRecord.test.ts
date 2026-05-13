// src/nodes/SmartSuite/__tests__/actions/record/upsertRecord.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as upsertRecord } from '../../../actions/record/upsertRecord.operation';
import { NodeOperationError } from 'n8n-workflow';
import * as utils from '../../../helpers/utils';
import * as validation from '../../../helpers/validation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs';

jest.mock('../../../helpers/validation', () => ({
  getTableIdWithStructure: jest.fn().mockResolvedValue({ id: 'dummy-table-id', structure: [] }),
}));

jest.mock('../../../transport/smartSuiteApi', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '../../../transport/smartSuiteApi';

describe('SmartSuite – upsertRecord Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    (apiRequest as jest.Mock).mockResolvedValue({ items: [] });
  });

  it('should create a new record if no match found', async () => {
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ id: 'new-record-id' });

    executeMock = createMockExecuteWithResources({
      parameters: {
        'fieldsUiUpdate.fieldsValues': [{ field: 'Name', value: 'John Doe' }],
      },
    });

    const result = await upsertRecord.call(executeMock);

    expect(result).toEqual([{ json: { id: 'new-record-id' } }]);
  });

  it('should update an existing record if match found', async () => {
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce({ items: [{ id: 'existing-123' }] })
      .mockResolvedValueOnce({ id: 'existing-123', updated: true });

    executeMock = createMockExecuteWithResources({
      parameters: {
        'fieldsUiUpdate.fieldsValues': [{ field: 'Name', value: 'Jane Doe' }],
      },
    });

    const result = await upsertRecord.call(executeMock);

    expect(result).toEqual([{ json: { id: 'existing-123', updated: true } }]);
  });

  it('should throw if matching field inputs are missing', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {
        matchingField: '',
        condition: '',
        matchValue: '',
        'fieldsUiUpdate.fieldsValues': [{ field: 'Name', value: 'Invalid' }],
      },
    });

    await expect(upsertRecord.call(executeMock)).rejects.toThrow(
      'Matching Field, Condition, and Match Value are required for Upsert Record',
    );
  });

  it('should throw if no fields are provided', async () => {
    executeMock = createMockExecuteWithResources({
      parameters: {
        matchingField: 'email',
        condition: 'equals',
        matchValue: 'x@x.com',
        'fieldsUiUpdate.fieldsValues': [],
      },
    });

    await expect(upsertRecord.call(executeMock)).rejects.toThrow(
      'You must provide at least one field to upsert',
    );
  });

  it('should throw for reserved field names', async () => {
    jest.spyOn(utils, 'isReservedField').mockReturnValue(true);

    executeMock = createMockExecuteWithResources({
      parameters: {
        matchingField: 'email',
        condition: 'equals',
        matchValue: 'x@x.com',
        'fieldsUiUpdate.fieldsValues': [{ field: '_created_date', value: 'x' }],
      },
    });

    await expect(upsertRecord.call(executeMock)).rejects.toThrow(
      'Cannot upsert system field “_created_date”.',
    );
  });

  it('should return full API response object', async () => {
    (apiRequest as jest.Mock)
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ id: 'abc', name: 'Upserted', created_at: 'today' });

    jest.spyOn(utils, 'isReservedField').mockReturnValue(false);
    jest.spyOn(utils, 'asIdString').mockImplementation((s) => s as string);

    executeMock = createMockExecuteWithResources({
      parameters: {
        matchingField: 'email',
        condition: 'equals',
        matchValue: 'check@this.com',
        'fieldsUiUpdate.fieldsValues': [{ field: 'name', value: 'Upserted' }],
      },
    });

    const result = await upsertRecord.call(executeMock);
    expect(result[0].json).toEqual({ id: 'abc', name: 'Upserted', created_at: 'today' });
  });

  it('should throw if getTableIdWithStructure fails', async () => {
    (validation.getTableIdWithStructure as jest.Mock).mockRejectedValueOnce(new Error('bad table'));

    executeMock = createMockExecuteWithResources({
      parameters: {},
    });

    await expect(upsertRecord.call(executeMock)).rejects.toThrow('bad table');
  });

  describe('fullnamefield transformation', () => {
    beforeEach(() => {
      (validation.getTableIdWithStructure as jest.Mock).mockResolvedValue({
        id: 'dummy-table-id',
        structure: [{ slug: 'contact_name', label: 'Contact Name', field_type: 'fullnamefield' }],
      });
    });

    it('should transform a "First Last" string to a fullname object on create path', async () => {
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({ items: [] })
        .mockResolvedValueOnce({ id: 'new-record-id' });

      executeMock = createMockExecuteWithResources({
        parameters: {
          matchingField: 'email',
          condition: 'equals',
          matchValue: 'john@example.com',
          'fieldsUiUpdate.fieldsValues': [{ field: 'contact_name', value: 'John Doe' }],
        },
      });

      await upsertRecord.call(executeMock);

      const createCall = (apiRequest as jest.Mock).mock.calls[1];
      expect(createCall[0]).toBe('POST');
      expect(createCall[2]).toEqual({
        contact_name: {
          sys_root: 'John Doe',
          salutation: '',
          first_name: 'John',
          middle_name: '',
          last_name: 'Doe',
          suffix: '',
        },
      });
    });

    it('should transform a "First Last" string to a fullname object on update path', async () => {
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({ items: [{ id: 'existing-123' }] })
        .mockResolvedValueOnce({ id: 'existing-123', updated: true });

      executeMock = createMockExecuteWithResources({
        parameters: {
          matchingField: 'email',
          condition: 'equals',
          matchValue: 'john@example.com',
          'fieldsUiUpdate.fieldsValues': [{ field: 'contact_name', value: 'John Doe' }],
        },
      });

      await upsertRecord.call(executeMock);

      const updateCall = (apiRequest as jest.Mock).mock.calls[1];
      expect(updateCall[0]).toBe('PATCH');
      expect(updateCall[2]).toEqual({
        contact_name: {
          sys_root: 'John Doe',
          salutation: '',
          first_name: 'John',
          middle_name: '',
          last_name: 'Doe',
          suffix: '',
        },
      });
    });

    it('should not transform non-fullnamefield string fields', async () => {
      (validation.getTableIdWithStructure as jest.Mock).mockResolvedValue({
        id: 'dummy-table-id',
        structure: [{ slug: 'title', label: 'Title', field_type: 'textfield' }],
      });
      (apiRequest as jest.Mock)
        .mockResolvedValueOnce({ items: [] })
        .mockResolvedValueOnce({ id: 'new-record-id' });

      executeMock = createMockExecuteWithResources({
        parameters: {
          matchingField: 'email',
          condition: 'equals',
          matchValue: 'x@x.com',
          'fieldsUiUpdate.fieldsValues': [{ field: 'title', value: 'John Doe' }],
        },
      });

      await upsertRecord.call(executeMock);

      const createCall = (apiRequest as jest.Mock).mock.calls[1];
      expect(createCall[2]).toEqual({ title: 'John Doe' });
    });
  });
});
