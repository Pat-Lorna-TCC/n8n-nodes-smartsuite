---
trigger: always_on
---

# 📦 SmartSuite n8n Community Node Architecture (v2)

This document outlines the folder structure, purpose, and file-by-file logic behind the `SmartSuite` node for n8n, modeled after Airtable’s node architecture.

---

## 🗂 Folder Structure & Roles

| Folder             | Purpose |
|--------------------|---------|
| `actions/`         | Grouped by resource (`record`, `table`, `solution`, `orgManagement`). Each file contains `description` + `execute()` for a single operation. |
| `helpers/`         | Shared utility functions and parameter snippets. No n8n-specific code here. |
| `methods/`         | Contains dynamic `loadOptions()` logic for UI dropdowns. |
| `transport/`       | Wraps low-level HTTP requests (`apiRequest()`), adds auth, and handles errors. |
| Root of `SmartSuite/`      | Ties everything together: routing, type declarations, version aggregation, node description, and execution. |
| `SmartSuite.node.ts` | Entry point — re-exports the node class from /node.type.ts`. |

---

## 🧾 File-by-File Overview

### `actions/record/`

| File                     | Description |
|--------------------------|-------------|
| `createRecord.operation.ts` | Creates new records via POST. |
| `updateRecord.operation.ts` | Updates existing records via PATCH. |
| `deleteRecord.operation.ts` | Deletes record(s) by ID. |
| `getRecord.operation.ts`    | Fetches a record by ID. |
| `listRecord.operation.ts`   | Lists records in a table. |
| `searchRecord.operation.ts` | Searches records with filters. |

Each file exports:
- `description: INodeProperties[]` → UI config
- `execute()` → Actual operation logic

---

### `actions/table/`

| File                          | Description |
|-------------------------------|-------------|
| `listTable.operation.ts`      | Lists all tables for a solution. |
| `getTable.operation.ts`       | Fetches a table by ID. |
| `createTable.operation.ts`    | Creates a new table in a solution. |
| `createTableField.operation.ts` | Adds a new field to an existing table. |

---

### `actions/solution/`

| File                     | Description |
|--------------------------|-------------|
| `listSolution.operation.ts` | Lists all accessible SmartSuite solutions. |
| `getSolution.operation.ts`  | Gets a single solution by ID. |

---

### `actions/orgManagement/`

| File                         | Description |
|------------------------------|-------------|
| `getCurrentUser.operation.ts` | Returns authenticated user's account info. |
| `listMembers.operation.ts`    | Lists all organization members. |
| `listTeams.operation.ts`      | Lists all org teams. |

---

## 🧠 Root Wiring

| File                     | Description |
|--------------------------|-------------|
| `SmartSuite.node.ts`     | Entry point: `export { nodeClass as SmartSuite }`. |
| `node.type.ts`           | Defines the `SmartSuite` class with `description` and `execute()` method. |
| `router.ts`              | Delegates to the correct handler from `resourceMapping.ts` using `resource` + `operation`. |
| `versionDescription.ts`  | Aggregates `description` arrays from all actions. |
| `types.ts`               | Shared TS types/interfaces. |

---

## 🧰 helpers/

| File                    | Purpose |
|-------------------------|---------|
| `common.descriptions.ts` | Parameter snippets reused across multiple actions. |
| `utils.ts`              | Stateless helpers: ID parsers, `debugLog`, etc. |

---

## 🔄 methods/

| File              | Purpose |
|-------------------|---------|
| `loadOptions.ts`  | Implements `loadOptions` logic for searchable/selectable dropdowns (e.g. solutions, tables). |
| `resourceMapping.ts`     | Imports and maps operation handlers for each resource. |

---

## 🌐 transport/

| File         | Description |
|--------------|-------------|
| `index.ts`   | Main HTTP handler. Exposes `apiRequest()`, sets headers, builds URLs, handles errors and logging. |

---

## 🔁 Execution Flow

```ts
SmartSuite.node.ts
   ↓
node.type.ts (SmartSuite class)
   ↓
execute() → router.ts
   ↓
router.ts → resourceMapping.ts
   ↓
actions/.../operation.ts (handler)
   ↓
transport/index.ts (apiRequest)

## 🐞Debug Logging Rule
- Always use the [debugLog](cci:1://file:///c:/Users/patan/Documents/GitHub/playground/n8n-nodes-smartsuite/src/nodes/SmartSuite/helpers/utils.ts:5:2-12:3) utility for all diagnostic and debug output in node code, especially in handlers, router, and loadOptions methods.
- Never use `console.log` directly.