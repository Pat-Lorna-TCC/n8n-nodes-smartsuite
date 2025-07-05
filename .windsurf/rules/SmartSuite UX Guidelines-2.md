---
trigger: always_on
---

## 5. Consistency in Property Types

1. **Use `type: 'options'` for any fixed set of choices.**  
   - E.g., “Operation” dropdown or status fields with enumerated values.

2. **Use `type: 'string'` for free‑form text or IDs (unless you want a resourceLocator).**

3. **Use `type: 'boolean'` for toggles such as “Return All.”**  
   - When `returnAll: true`, hide the “Limit” field via:
     ```ts
     displayOptions: {
       show: { returnAll: [false] },
     },
     ```

4. **Use `type: 'number'` for numeric inputs (e.g., limit, offset). Include `typeOptions: { minValue, maxValue }` when relevant.**

5. **Use `type: 'collection'` or `type: 'fixedCollection'` only for truly nested inputs (e.g., multiple filter criteria), not for simple fields.**

---

## 6. Naming & File Organization

1. **Put each operation’s field definitions in its own file named `<operationName>.operation.ts`.**  
   - For example:
     ```
     src/nodes/SmartSuite/actions/record/listRecord.operation.ts
     src/nodes/SmartSuite/actions/table/createTable.operation.ts
     ```
   - Export an array called `description` from each.

2. **Top‑level node file (e.g., `node.type.ts`) should only import:**
   - n8n interface types (`INodeType`, `INodeTypeDescription`, etc.)
   - `router`
   - any shared `helpers/utils` or `helpers/common.descriptions`
   - each operation file’s `description` array
   - any `methods.loadOptions` functions

3. **Always add a comment with the file’s relative path at the top of each `.ts` file.**  
   - E.g.:
     ```ts
     // src/nodes/SmartSuite/actions/record/listRecord.operation.ts
     ```

4. **Keep your folder structure modular:**
   ```
   SmartSuite/
   ├── helpers/
   │   ├── common.descriptions.ts
   │   └── utils.ts
   ├── methods/
   │   └── loadOptions.ts
   ├── actions/
   │   ├── record/
   │   │   ├── listRecord.operation.ts
   │   │   ├── getRecord.operation.ts
   │   │   └── …
   │   ├── table/
   │   │   ├── listTable.operation.ts
   │   │   └── …
   │   └── solution/
   │       ├── listSolution.operation.ts
   │       └── getSolution.operation.ts
   ├── router.ts
   └── node.type.ts
   ```

5. **Export all resources/operations from a single `router.ts` so the node’s `execute()` simply calls that router.**

---

## 7. Debug Logging & Constructor

1. **In `node.type.ts` constructor, log that the node has loaded:**
   ```ts
   constructor() {
     debugLog('[SmartSuite.node.type.ts] constructor loaded');
     const hasSearch = typeof this.methods?.loadOptions?.solutionSearch === 'function';
     debugLog('[SmartSuite.node.type.ts] solutionSearch attached →', hasSearch);
   }
   ```
   - Ensures you can confirm loadOptions are attached at startup.

2. **Log again in `execute()`:**
   ```ts
   async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
     debugLog('[SmartSuite.node.type.ts] execute called');
     return await router.call(this);
   }

## 8. Consistency in UX Labels & Descriptions

1. **Every dropdown choice needs a `name` (label) and `value`.**  
   - E.g.:
     ```ts
     options: [
       { name: 'List Records', value: 'list' },
       { name: 'Get Record', value: 'get' },
       // …
     ],
     ```

2. **Provide an explicit `description` for each field (if it’s not obvious).**  
   - Even if minimal, add something like:  
     `"The ID of the table to retrieve records from."`

3. **For boolean toggles, include a clear `description` so the user knows exactly what “Return All” does.**

4. **If a field can accept multiple types (e.g., string or number), explicitly say so in the description.**

---

## 9. Error Handling UX

1. **When expecting an ID, validate input using a Regex if possible.**  
   - E.g.:
     ```ts
     validation: [
       {
         type: 'regex',
         properties: {
           regex: '.+',
           errorMessage: 'Table ID must not be empty.',
         },
       },
     ],
     ```
   - This surfaces input errors immediately rather than at runtime.

2. **If an operation is not supported for a given resource, throw an early Error in `router.ts` (e.g., `throw new Error('Unsupported record:update')`).**  
   - Prevents the UI from hanging on an unhandled operation selection.

---

## 10. Final UX Checklist

1. **Resource dropdown first, always.**  
2. **Operation dropdown scoped to resource.**  
3. **Spread in all operation‑specific fields immediately after the corresponding operation.**  
4. **Use `displayOptions` to conditionally show/hide fields based on resource & operation.**  
5. **Leverage `methods.loadOptions` to populate searchable dropdowns for IDs.**  
6. **Keep naming consistent:**
   - Internal `name` = camelCase
   - `displayName` = human-friendly
7. **Debug log in constructor + execute.**  
8. **Group files in a clear folder hierarchy.**  
9. **Validate required IDs with simple regex.**  
10. **Every field has a concise description and correct `type`.**

   ```
   - Guarantees you know when the node’s execution begins.