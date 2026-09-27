/** Endpoints under /users - registration, login and profile. */
class UsersApi {
  constructor(http) {
    this.http = http;
  }

  register(user) {
    return this.http.post('/users/register', {
      first_name: user.firstName,
      last_name: user.lastName,
      dob: user.dateOfBirth,
      phone: user.phone,
      email: user.email,
      password: user.password,
      address: {
        street: user.address.street,
        city: user.address.city,
        state: user.address.state,
        country: user.address.country,
        postal_code: user.address.postalCode,
      },
    });
  }

  login(email, password) {
    return this.http.post('/users/login', { email, password });
  }

  me() {
    return this.http.get('/users/me');
  }

  list() {
    return this.http.get('/users');
  }

  /**
   * Registers a user and returns their access token. Used by fixtures that need
   * a throwaway account rather than the shared seeded customer.
   */
  async registerAndLogin(user) {
    const created = await this.register(user);
    if (!created.ok()) {
      throw new Error(`Could not register ${user.email}: ${created.status()} ${await created.text()}`);
    }

    const session = await this.login(user.email, user.password);
    if (!session.ok()) {
      throw new Error(`Could not sign in as ${user.email}: ${session.status()}`);
    }

    const { access_token: accessToken } = await session.json();
    return { user, accessToken, profile: await created.json() };
  }
}

module.exports = { UsersApi };
