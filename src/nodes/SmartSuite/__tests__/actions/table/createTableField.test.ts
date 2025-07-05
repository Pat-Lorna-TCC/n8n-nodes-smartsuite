// src/nodes/SmartSuite/__tests__/actions/table/createTableField.test.ts

import type { IExecuteFunctions } from 'n8n-workflow';
import { execute as createTableField } from '../../../actions/table/createTableField.operation';
import { createMockExecuteWithResources } from '../../../__tests__/helpers/mockResourceInputs'; // Import the helper function

// Mock the validation helpers to return dummy IDs
jest.mock('../../../helpers/validation', () => ({
  getSolutionId: jest.fn().mockResolvedValue('dummy-solution-id'),
  getTableId: jest.fn().mockResolvedValue('dummy-table-id'),  // Ensure it returns a dummy table ID
}));

describe('SmartSuite – createTableField Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeEach(() => {
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: [{ json: {} }],
      parameters: {
        fieldName: 'My New Field',
        fieldType: 'textfield',
        helpText: 'Test help text',
      },
    });
  });

  it('should call httpRequest with correct payload and return success', async () => {
    // Spy on httpRequest via any-cast
    const httpSpy = jest.spyOn((executeMock.helpers as any), 'httpRequest');

    const result = await createTableField.call(executeMock);

    // Grab the first call's options and cast to any to access properties
    const httpOpts = (httpSpy.mock.calls[0][0] as any);

    expect(httpOpts.method).toBe('POST');
    expect(httpOpts.url).toContain(`/applications/dummy-table-id/add_field/`);
    expect(httpOpts.body).toEqual(
      expect.objectContaining({
        field: expect.objectContaining({
          name: 'My New Field',
          label: 'My New Field',
          field_type: 'textfield',
          slug: 'my_new_field',
        }),
        field_position: { position: 1 },
        auto_fill_structure_layout: true,
      }),
    );

    // Assert the operation returns only the success flag
    expect(result).toEqual([{ json: { success: true } }]);
  });

  it('should throw NodeOperationError when request fails', async () => {
    // Mock rejection for httpRequest
    jest.spyOn((executeMock.helpers as any), 'httpRequest')
      .mockRejectedValueOnce(new Error('Permission denied'));

    await expect(createTableField.call(executeMock))
      .rejects
      .toThrow('Permission denied');
  });

  it('should handle non-textfield types correctly', async () => {
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: [{ json: {} }],
      parameters: {
        fieldName: 'My New Number Field',
        fieldType: 'number', // Non-textfield type
        helpText: 'Test help text',
      },
    });

    const httpSpy = jest.spyOn((executeMock.helpers as any), 'httpRequest');
    await createTableField.call(executeMock);

    const httpOpts = (httpSpy.mock.calls[0][0] as any);

    expect(httpOpts.body).toEqual(
      expect.objectContaining({
        field: expect.objectContaining({
          name: 'My New Number Field',
          label: 'My New Number Field',
          field_type: 'number',  // Expect the correct field type
          slug: 'my_new_number_field',
        }),
        field_position: { position: 1 },
        auto_fill_structure_layout: true,
      }),
    );
  });

  it('should generate a valid slug from the field name', async () => {
    executeMock = createMockExecuteWithResources({
      apiRequestResponse: {},
      inputData: [{ json: {} }],
      parameters: {
        fieldName: 'Field Name With Spaces and !!!', // Special characters
        fieldType: 'textfield',
        helpText: 'Test help text',
      },
    });

    const httpSpy = jest.spyOn((executeMock.helpers as any), 'httpRequest');
    await createTableField.call(executeMock);

    const httpOpts = (httpSpy.mock.calls[0][0] as any);

    expect(httpOpts.body.field.slug).toBe('field_name_with_spaces_and');
  });
});
