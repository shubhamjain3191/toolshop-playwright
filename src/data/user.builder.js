const { faker } = require('@faker-js/faker');

/**
 * Builds a valid customer payload.
 *
 * Emails are salted with a timestamp because the suite runs in parallel against
 * a shared public instance - two workers generating the same faker email would
 * collide on the unique constraint and produce a confusing 422.
 *
 * The password is assembled rather than randomised: the API enforces upper,
 * lower, digit and symbol, and a fully random string fails that check often
 * enough to be annoying.
 */
function buildUser(overrides = {}) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    firstName,
    lastName,
    dateOfBirth: '1988-04-12',
    phone: faker.string.numeric(10),
    email: `${firstName}.${lastName}.${Date.now()}${faker.string.numeric(3)}`.toLowerCase() + '@example.com',
    password: `${faker.internet.password({ length: 10 })}A1!`,
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: 'AT',
      postalCode: faker.string.numeric(4),
      houseNumber: faker.string.numeric(2),
    },
    ...overrides,
  };
}

module.exports = { buildUser };
