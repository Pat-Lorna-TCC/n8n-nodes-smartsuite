// src/nodes/SmartSuite/actions/table/createTableField.operation.ts

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { debugLog } from '../../helpers/utils';
import { apiRequest } from '../../transport/smartSuiteApi';
import { getTableId } from '../../helpers/validation';

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  debugLog('[Table] createTableField.execute called', this.getNode().parameters, 2);
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const tableId = await getTableId.call(this, i);

    const fieldName = this.getNodeParameter('fieldName', i) as string;
    const fieldType = this.getNodeParameter('fieldType', i) as string;
    const helpText  = this.getNodeParameter('helpText', i) as string;

    // Generate a valid slug from the field name
    const slug = fieldName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    // Build params for text fields
    const params =
      fieldType === 'textfield'
        ? { max_length: 255, help_text: helpText, help_text_display_format: 'tooltip' }
        : {};

    const body: IDataObject = {
      field: {
        name:       fieldName,
        label:      fieldName,
        field_type: fieldType,
        slug,
        params,
      },
      field_position: { position: 1 },
      auto_fill_structure_layout: true,
    };

    debugLog('[Table] createTableField.payload', body, 2);
    try {
      await apiRequest.call(
        this,
        'POST',
        `/applications/${tableId}/add_field/`,
        body,
      );
      returnData.push({ json: { success: true } });
    } catch (err: any) {
      throw new NodeOperationError(this.getNode(), err.message, { itemIndex: i });
    }
  }

  return returnData;
}
