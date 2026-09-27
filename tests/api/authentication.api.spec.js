const { test, expect } = require('../../src/fixtures/test');
const { expectValidSchema } = require('../../src/utils/validate');
const { userSchema, tokenSchema } = require('../../src/api/schemas');
const { buildUser } = require('../../src/data/user.builder');

test.describe('Registration and authentication API', () => {
  test('registers a new customer @smoke', async ({ api }) => {
    const user = buildUser();

    const response = await api.users.register(user);
    expect(response.status()).toBe(201);

    const created = await response.json();
    expectValidSchema(userSchema, created, 'POST /users/register');

    expect(created.email).toBe(user.email);
    expect(created.first_name).toBe(user.firstName);
    expect(created.address.city).toBe(user.address.city);
  });

  test('never echoes the password back in the registration response', async ({ api }) => {
    const user = buildUser();

    const response = await api.users.register(user);
    const body = await response.text();

    expect(body).not.toContain(user.password);
    expect(Object.keys(await response.json())).not.toContain('password');
  });

  test('rejects a duplicate email address', async ({ api }) => {
    const user = buildUser();

    const first = await api.users.register(user);
    expect(first.status()).toBe(201);

    const second = await api.users.register(user);

    // 409 rather than 422 - the payload is valid, it just conflicts with an
    // existing record. Correct REST semantics, and worth pinning down so a
    // future "tidy up the error handling" change cannot silently alter it.
    expect(second.status()).toBe(409);
    expect(await second.json()).toEqual({
      email: ['A customer with this email address already exists.'],
    });
  });

  test('reports every missing required field at once', async ({ api }) => {
    const response = await api.http.post('/users/register', {});

    expect(response.status()).toBe(422);

    const errors = await response.json();
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(['first_name', 'last_name', 'email', 'password'])
    );
  });

  test('issues a bearer token on successful login @smoke', async ({ api, newCustomer }) => {
    const response = await api.users.login(newCustomer.user.email, newCustomer.user.password);

    expect(response.status()).toBe(200);
    expectValidSchema(tokenSchema, await response.json(), 'POST /users/login');
  });

  test('refuses a login with the wrong password', async ({ api, newCustomer }) => {
    const response = await api.users.login(newCustomer.user.email, 'DefinitelyNotTheP4ss!');

    expect(response.status()).toBe(401);
    expect(await response.text()).not.toContain('access_token');
  });

  test('gives the same response for an unknown email as for a wrong password', async ({
    api,
    newCustomer,
  }) => {
    // User enumeration check: the two failures must be indistinguishable to a caller.
    const unknownUser = await api.users.login('nobody.at.all@example.com', 'DefinitelyNotTheP4ss!');
    const wrongPassword = await api.users.login(newCustomer.user.email, 'DefinitelyNotTheP4ss!');

    expect(unknownUser.status()).toBe(wrongPassword.status());
    expect(await unknownUser.text()).toBe(await wrongPassword.text());
  });

  test('returns the profile of the authenticated user', async ({ apiAs, newCustomer }) => {
    const response = await apiAs(newCustomer.accessToken).users.me();
    expect(response.status()).toBe(200);

    const profile = await response.json();
    expect(profile.email).toBe(newCustomer.user.email);
    expect(profile.id).toBe(newCustomer.profile.id);
  });

  test('rejects an unauthenticated request for the profile', async ({ api }) => {
    const response = await api.users.me();

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });

  test('rejects a malformed bearer token', async ({ apiAs }) => {
    const response = await apiAs('not-a-real-jwt').users.me();

    expect(response.status()).toBe(401);
  });
});
