const base = require('@playwright/test');

const { env } = require('../config/env');
const { HttpClient } = require('../api/http-client');
const { UsersApi } = require('../api/users.api');
const { ProductsApi } = require('../api/products.api');
const { buildUser } = require('../data/user.builder');

const { HomePage } = require('../pages/home.page');
const { LoginPage } = require('../pages/login.page');
const { RegisterPage } = require('../pages/register.page');
const { ProductPage } = require('../pages/product.page');
const { CheckoutPage } = require('../pages/checkout.page');

/**
 * Builds the API facade on top of a request context. Both the API tests and the
 * UI tests use this - UI tests lean on it to set up state quickly instead of
 * clicking through screens they are not actually testing.
 */
function buildApi(request, token) {
  const http = new HttpClient(request, token);
  return { http, users: new UsersApi(http), products: new ProductsApi(http) };
}

const test = base.test.extend({
  /**
   * A request context pinned to the API host. UI projects have their baseURL set
   * to the web app, so we cannot reuse the built-in `request` fixture there
   * without every call needing an absolute URL.
   */
  apiRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ baseURL: env.apiBaseUrl });
    await use(context);
    await context.dispose();
  },

  api: async ({ apiRequest }, use) => {
    await use(buildApi(apiRequest));
  },

  /**
   * Factory for an API facade authenticated as an arbitrary token, so a test can
   * switch identity without standing up another request context.
   */
  apiAs: async ({ apiRequest }, use) => {
    await use((token) => buildApi(apiRequest, token));
  },

  /**
   * Token for the seeded demo customer.
   *
   * Fetched per test rather than cached in a storageState file: the API issues
   * tokens with a 300-second TTL, so a state file written once at the start of
   * the run would be expired by the time later tests used it.
   */
  customerToken: async ({ apiRequest }, use) => {
    const { users } = buildApi(apiRequest);
    const response = await users.login(env.customer.email, env.customer.password);

    base.expect(response.ok(), 'seeded customer should be able to sign in').toBeTruthy();
    const { access_token: token } = await response.json();

    await use(token);
  },

  customerApi: async ({ apiRequest, customerToken }, use) => {
    await use(buildApi(apiRequest, customerToken));
  },

  /**
   * A freshly registered account, for tests that mutate user-scoped data and
   * would otherwise interfere with each other on the shared demo instance.
   */
  newCustomer: async ({ api }, use) => {
    const account = await api.users.registerAndLogin(buildUser());
    await use(account);
  },

  /**
   * Signs the browser in as the seeded customer.
   *
   * The app keeps its JWT in localStorage under `auth-token`, so seeding that
   * key before the Angular app boots is equivalent to logging in through the
   * form - but costs one API call instead of a page load plus a redirect.
   * Exposed as a function rather than a pre-authenticated page so the intent is
   * visible in the test body; tests about the login screen itself use LoginPage.
   */
  signInAsCustomer: async ({ page, customerToken }, use) => {
    await use(async () => {
      await page.addInitScript((token) => {
        window.localStorage.setItem('auth-token', token);
      }, customerToken);
    });
  },

  homePage: async ({ page }, use) => use(new HomePage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
});

module.exports = { test, expect: base.expect, buildApi };
