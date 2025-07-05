---
trigger: always_on
---

# WindSurf UX Guidelines (Part 1)

## 1. General Layout and Ordering

1. **Always start with a top‑level “Resource” selector.**
   - Placed first in the properties array.
   - Uses `type: 'options'` and is required.

2. **Immediately follow “Resource” with an “Operation” selector for each resource.**
   - The operation dropdown must be scoped to the chosen resource via:
     ```js
     displayOptions: {
       show: { resource: ['<resourceName>'] }
     },
     ```
   - Each resource has its own `Operation` field (e.g., one for `record`, one for `table`, etc.), even though they share the same internal `name: 'operation'`.

3. **Group all fields for a given resource together.**
   - After the “Operation” selector for a resource, include all that resource’s fields (spread in from arrays).
   - For example, after:
     ```js
     displayOptions: { show: { resource: ['record'] } }
     ```
     immediately spread in:
     ```js
     ...Array.from(listRecordFields),
     ...Array.from(getRecordFields),
     ...
     ```

4. **Within each resource group, order fields by logical operation grouping.**
   - “Record” fields follow this order: List → Get → Create → Update → Delete → Search.
   - “Table” fields follow: List Tables → Get Table → Create Table → Create Field.
   - “Solution” fields: List → Get.
   - “Org Management” fields: List Members → List Teams → Get Current User.

## 2. Field Definitions and Naming

1. **`displayName` vs `name`:**  
   - `displayName` is the user‑facing label (e.g., “Solution,” “Operation,” “List Records”).  
   - `name` is the internal key (e.g., `resource`, `operation`, `solutionIdList`) and must be unique across this node’s properties.

2. **Use clear, human‑readable `displayName` values.**  
   - E.g., “List Records,” “Get Table,” “Create Field.”  
   - Keep them consistent across resources (always prefix list operations with “List”).

3. **Internal `name` should be all lowercase and use camelCase.**  
   - E.g., `tableId`, `solutionIdList`, `returnAll`, `limit`.

4. **When creating a dynamic dropdown, use a `type: 'resourceLocator'` or `type: 'options'` with `typeOptions.searchListMethod`.**  
   - Example:
     ```ts
     {
       displayName: 'Solution',
       name: 'solutionIdList',
       type: 'resourceLocator',
       default: { mode: 'list', value: '' },
       modes: [
         {
           displayName: 'From List',
           name: 'list',
           type: 'list',
           typeOptions: { searchListMethod: 'solutionSearch', searchable: true },
         },
         {
           displayName: 'By ID',
           name: 'id',
           type: 'string',
           placeholder: 'Solution ID',
         },
       ],
       required: true,
       displayOptions: {
         show: { resource: ['solution'], operation: ['get'] },
       },
     }
     ```

5. **Use a consistent suffix for field arrays imported from operation files.**
   - E.g., `listRecordFields`, `getRecordFields`, `createRecordFields`, etc.  
   - Then spread (`...`) each of these arrays directly into the `properties` array.

---

## 3. Conditional Visibility (`displayOptions`)

1. **Scope each field to its resource and operation.**  
   - Every operation’s fields must include:
     ```js
     displayOptions: {
       show: { resource: ['<resourceName>'], operation: ['<operationValue>'] },
     },
     ```
   - Ensures only relevant fields appear when that resource + operation is selected.

2. **If a field is shared across multiple operations of the same resource, list multiple operation values.**  
   - Example:
     ```ts
     displayOptions: {
       show: {
         resource: ['record'],
         operation: ['get', 'update', 'delete'],
       },
     },
     ```

3. **For nested selectors (e.g., choosing a Table then a Record ID), chain `displayOptions` so the dependent field appears only when its parent value is provided.**  
   - E.g., if “tableId” is needed before “recordId,” then on “recordId”:
     ```ts
     displayOptions: {
       show: {
         resource: ['record'],
         operation: ['get'],
         tableId: ['<any‑nonempty‑value>'],
       },
     },
     ```

4. **Prefer `displayOptions.show` over `displayOptions.hide` for explicitness.**

---

## 4. Dynamic Dropdowns / Load Options

1. **All dynamic dropdowns must live in `methods.loadOptions`.**  
   - Example:
     ```ts
     methods: {
       loadOptions: {
         solutionSearch,
         tableSearch,
       },
     },
     ```
   - These functions return a `Promise<INodeListSearchResult[]>` and drive the searchable lists.

2. **Name each load option function clearly: `<resource>Search`, `<table>Search`, etc.**  
   - Then reference them by name in `typeOptions.searchListMethod`.

3. **Use helper utilities (e.g., `apiRequest`) inside your loadOptions to fetch live data.**  
   - Each load option function must accept `(this: ILoadOptionsFunctions, searchQuery?: string)` and return properly shaped objects: `{ name: string; value: string }`.

4. **For hierarchical selects (e.g., Solution → Table → Record), always pass the parent’s ID as a parameter to the load function.**  
   - E.g.:
     ```ts
     const solutionId = this.getCurrentNodeParameter('solutionIdList', 0).value;
     ```

5. **Always include a fallback “By ID” string mode for each resource.**  
   - Even if you offer a searchable dropdown, allow an alternate “By ID” mode so the user can paste in a known ID.


## 2. Field Definitions and Naming

1. **`displayName` vs `name`:**  
   - `displayName` is the user‑facing label (e.g., “Solution,” “Operation,” “List Records”).  
   - `name` is the internal key (e.g., `resource`, `operation`, `solutionIdList`) and must be unique across this node’s properties.

2. **Use clear, human‑readable `displayName` values.**  
   - E.g., “List Records,” “Get Table,” “Create Field.”  
   - Keep them consistent across resources (always prefix list operations with “List”).

3. **Internal `name` should be all lowercase and use ca