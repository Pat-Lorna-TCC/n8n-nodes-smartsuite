// scripts/generate-tests.js

/**
 * Scans all *.operation.ts files under src/nodes/SmartSuite/actions
 * and creates a corresponding __tests__/*.test.ts stub for each.
 */

const fs = require('fs');
const path = require('path');
const { sync: globSync } = require('glob');

const SRC_ROOT = path.join(__dirname, '..', 'src', 'nodes', 'SmartSuite');
const TEST_ROOT = path.join(SRC_ROOT, '__tests__');

// Build a forward-slash pattern for glob
const pattern = path
  .join(SRC_ROOT, 'actions', '**', '*.operation.ts')
  .split(path.sep)
  .join('/');

console.log('🔍 Searching for operation files with pattern:', pattern);

const operationFiles = globSync(pattern);

console.log(`📄 Found ${operationFiles.length} operation file(s).`);

if (operationFiles.length === 0) {
  console.warn('⚠️  No .operation.ts files found under', SRC_ROOT);
  process.exit(0);
}

operationFiles.forEach((filePath) => {
  // Compute relative parts
  const rel = path.relative(path.join(SRC_ROOT, 'actions'), filePath);
  const dir = path.dirname(rel);                       // e.g. 'record'
  const base = path.basename(rel, '.operation.ts');    // e.g. 'createRecord'
  const testDir = path.join(TEST_ROOT, 'actions', dir);
  const testFile = path.join(testDir, `${base}.test.ts`);

  // Skip if test already exists
  if (fs.existsSync(testFile)) return;

  // Ensure the test directory exists
  fs.mkdirSync(testDir, { recursive: true });

  // Compute correct import path (relative, with forward-slashes)
  const importPath = path
    .relative(testDir, path.dirname(filePath))
    .split(path.sep)
    .join('/');

  const stub = `// ${path.relative(process.cwd(), testFile)}

import type { IExecuteFunctions } from 'n8n-core';
import { ${base} } from '${importPath}/${base}.operation';
import { mockExecuteFunctions } from '../../../shared/__testHelpers__/mockExecuteFunctions';

describe('SmartSuite – ${base} Operation', () => {
  let executeMock: IExecuteFunctions;

  beforeAll(() => {
    executeMock = mockExecuteFunctions({
      apiRequestResponse: {},
    });
  });

  it('should …', async () => {
    // TODO: mock this.getNodeParameter if needed
    const result = await ${base}.execute.call(executeMock, [[{ json: {} }]]);
    expect(result).toBeDefined();
    // TODO: add more specific assertions
  });
});
`;

  fs.writeFileSync(testFile, stub, 'utf8');
  console.log('✅ Created test stub:', path.relative(process.cwd(), testFile));
});

console.log('🎉 All done!');
