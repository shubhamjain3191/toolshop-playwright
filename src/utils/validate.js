const { expect } = require('@playwright/test');

/**
 * Asserts a payload matches a zod schema and, when it does not, fails with the
 * actual validation issues instead of a bare "expected true, got false".
 */
function expectValidSchema(schema, payload, label = 'response') {
  const result = schema.safeParse(payload);

  const issues = result.success
    ? ''
    : result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');

  expect(result.success, `${label} did not match its schema:\n${issues}`).toBe(true);

  return result.data;
}

module.exports = { expectValidSchema };
