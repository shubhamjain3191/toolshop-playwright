const { test, expect } = require('../../src/fixtures/test');
const { env } = require('../../src/config/env');
const { buildUser } = require('../../src/data/user.builder');

test.describe('Sign in', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('a registered customer can sign in @smoke', async ({ loginPage, page }) => {
    await loginPage.loginAndWait(env.customer.email, env.customer.password);

    await expect(page).toHaveURL(/\/account$/);

    await loginPage.header.openNavigation();
    await expect(loginPage.header.userMenu).toBeVisible();
    await expect(loginPage.header.signInLink).toBeHidden();
  });

  test('rejects a wrong password without saying which field was wrong', async ({ loginPage }) => {
    await loginPage.login(env.customer.email, 'ThisIsNotThePassword1!');

    await expect(loginPage.loginError).toBeVisible();
    await expect(loginPage.loginError).toHaveText('Invalid email or password');
  });

  test('gives the same message for an unknown account', async ({ loginPage }) => {
    // Same wording as the wrong-password case, so the form cannot be used to
    // work out which email addresses are registered.
    await loginPage.login('definitely-not-registered@example.com', 'ThisIsNotThePassword1!');

    await expect(loginPage.loginError).toHaveText('Invalid email or password');
  });

  test('flags both fields when the form is submitted empty', async ({ loginPage }) => {
    await loginPage.submit.click();

    await expect(loginPage.emailError).toHaveText('Email is required');
    await expect(loginPage.passwordError).toHaveText('Password is required');
  });

  test('stays on the login page when authentication fails', async ({ loginPage, page }) => {
    await loginPage.login(env.customer.email, 'ThisIsNotThePassword1!');

    await expect(loginPage.loginError).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('signing out returns the user to an anonymous session', async ({ loginPage, page }) => {
    await loginPage.loginAndWait(env.customer.email, env.customer.password);
    await loginPage.header.signOut();

    await expect(page).toHaveURL(/\/auth\/login$/);

    await loginPage.header.openNavigation();
    await expect(loginPage.header.signInLink).toBeVisible();
    await expect(loginPage.header.userMenu).toBeHidden();
  });

  test('the account page is not reachable once signed out', async ({ loginPage, page }) => {
    await loginPage.loginAndWait(env.customer.email, env.customer.password);
    await loginPage.header.signOut();

    await page.goto('/account');

    await expect(page, 'an anonymous visitor should be bounced to login').toHaveURL(/\/auth\/login/);
  });
});

test.describe('Registration', () => {
  test('a new customer can register and then sign in @smoke', async ({ registerPage, loginPage, page }) => {
    const user = buildUser();

    await registerPage.open();
    await registerPage.register(user);

    // The app drops you on the login form once the account is created.
    await page.waitForURL(/\/auth\/login/);

    await loginPage.loginAndWait(user.email, user.password);

    await loginPage.header.openNavigation();
    await expect(loginPage.header.userMenu).toContainText(user.firstName);
  });

  test('will not submit an empty form', async ({ registerPage, page }) => {
    await registerPage.open();
    await registerPage.submit.click();

    const errors = await registerPage.visibleErrors();
    expect(errors.length).toBeGreaterThan(0);
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});
