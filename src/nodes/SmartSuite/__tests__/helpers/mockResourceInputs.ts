// src/nodes/SmartSuite/__tests__/helpers/mockResourceInputs.ts

import { mockExecuteFunctions } from '../../shared/__testHelpers__/mockExecuteFunctions';
import { INodeExecutionData } from 'n8n-workflow'; // Import INodeExecutionData

export const createMockExecuteWithResources = ({
  solutionId = 'dummy-solution-id',
  tableId = 'dummy-table-id',
  fieldId = 'dummy-field-id',
  recordId = 'dummy-record-id',
  parameters = {},
  apiRequestResponse = {},
  inputData = [{ json: {} }],  // Accept inputData as a parameter
}: {
  solutionId?: string;
  tableId?: string;
  fieldId?: string;
  recordId?: string;
  parameters?: Record<string, any>;
  apiRequestResponse?: any;
  inputData?: INodeExecutionData[];  // Ensure inputData is part of the argument list
}) => {
  const defaultParameters = {
    matchingField: 'email', // default value for matchingField
    condition: 'equals', // default condition
    matchValue: 'test@example.com', // default matchValue
    'fieldsUiUpdate.fieldsValues': [{ field: 'Name', value: 'John Doe' }], // default fields
    solutionId,
    tableId,
    fieldId,
    recordId,
    ...parameters, // spread any custom parameters passed in
  };

  return mockExecuteFunctions({
    apiRequestResponse,  // Pass apiRequestResponse here
    inputData,           // Pass inputData here
    parameters: defaultParameters, // Include parameters
  });
};
