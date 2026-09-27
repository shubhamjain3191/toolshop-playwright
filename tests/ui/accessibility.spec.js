const AxeBuilder = require('@axe-core/playwright').default;

const { test, expect } = require('../../src/fixtures/test');

/**
 * Accessibility checks.
 *
 * The application already has a handful of WCAG violations, so a plain
 * "expect(violations).toEqual([])" would fail on day one and be switched off by
 * the end of the week. Instead each page carries a baseline of the issues that
 * were present when the check was introduced, and the test fails only on
 * something new. That keeps the build honest without blocking it on a backlog
 * nobody has scheduled yet.
 *
 * The baseline is meant to shrink. Every entry below is a known bug, not an
 * acceptable state - see docs/FINDINGS.md.
 */
const pages = [
  {
    name: 'catalogue',
    path: '/',
    ready: (page) => page.locator('a[data-test^="product-"]').first().waitFor(),
    baseline: ['list'],
  },
  {
    name: 'sign in',
    path: '/auth/login',
    ready: (page) => page.getByTestId('login-form').waitFor(),
    baseline: ['button-name'],
  },
  {
    name: 'registration',
    path: '/auth/register',
    ready: (page) => page.getByTestId('register-form').waitFor(),
    baseline: ['button-name', 'list'],
  },
];

for (const { name, path, ready, baseline } of pages) {
  test(`the ${name} page has no new accessibility violations`, async ({ page }, testInfo) => {
    await page.goto(path);
    await ready(page);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    // Keep the whole report on the run, not just the assertion message - it is
    // what makes a failure actionable six weeks later.
    await testInfo.attach(`axe-${name}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    const regressions = results.violations.filter((v) => !baseline.includes(v.id));
    const summary = regressions.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} nodes): ${v.help}`);

    expect(summary, `new accessibility violations on ${path}`).toEqual([]);
  });
}
