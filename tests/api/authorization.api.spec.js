const { test, expect } = require('../../src/fixtures/test');

/**
 * Authorisation checks.
 *
 * These matter more than the happy paths. A broken read endpoint gets noticed in
 * minutes; a missing permission check can sit in production for months, so the
 * negative cases get their own file rather than being buried at the bottom of
 * the catalogue spec.
 */
test.describe('Authorisation', () => {
  test('a customer cannot list every user account @smoke', async ({ apiAs, newCustomer }) => {
    const response = await apiAs(newCustomer.accessToken).users.list();

    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ message: 'Forbidden' });
  });

  test('an anonymous caller cannot list users', async ({ api }) => {
    const response = await api.users.list();

    expect(response.status()).toBe(401);
  });

  test('an anonymous caller cannot read a profile', async ({ api }) => {
    const response = await api.users.me();

    expect(response.status()).toBe(401);
  });

  /**
   * Known defect - reported upstream, see docs/FINDINGS.md (TS-001).
   *
   * POST /products currently answers 201 for an anonymous caller: the catalogue
   * write endpoints validate the payload but never check who is asking. This
   * test encodes the behaviour we expect, and is marked fixme rather than fail
   * on purpose - running it would write junk rows into a shared public demo
   * database on every CI run, which is not a reasonable thing to do to someone
   * else's server. Drop the .fixme to reproduce it locally.
   */
  test.fixme('an anonymous caller cannot create a product', async ({ api }) => {
    const category = (await (await api.products.categories()).json())[0];
    const brand = (await (await api.products.brands()).json())[0];

    const response = await api.products.create({
      name: 'Unauthorised product',
      description: 'Created without a token',
      price: 9.99,
      category_id: category.id,
      brand_id: brand.id,
      is_location_offer: false,
      is_rental: false,
    });

    expect(response.status(), 'catalogue writes must require authentication').toBe(401);
  });

  test.fixme('a customer cannot create a product', async ({ apiAs, newCustomer, api }) => {
    const category = (await (await api.products.categories()).json())[0];
    const brand = (await (await api.products.brands()).json())[0];

    const response = await apiAs(newCustomer.accessToken).products.create({
      name: 'Unauthorised product',
      description: 'Created by a customer',
      price: 9.99,
      category_id: category.id,
      brand_id: brand.id,
      is_location_offer: false,
      is_rental: false,
    });

    expect(response.status(), 'only admins should be able to create products').toBe(403);
  });
});
