/**
 * Thin wrapper over Playwright's APIRequestContext.
 *
 * It exists for two reasons: to stop every test repeating the bearer-token
 * header, and to give us one place to log/inspect traffic if a test starts
 * misbehaving. Deliberately does not assert on status codes - that is the
 * test's job, and several of our tests care about 4xx responses.
 */
class HttpClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} [token] bearer token for authenticated calls
   */
  constructor(request, token) {
    this.request = request;
    this.token = token;
  }

  headers(extra = {}) {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...extra,
    };
  }

  get(url, options = {}) {
    return this.request.get(url, { headers: this.headers(), ...options });
  }

  post(url, data, options = {}) {
    return this.request.post(url, { headers: this.headers(), data, ...options });
  }

  put(url, data, options = {}) {
    return this.request.put(url, { headers: this.headers(), data, ...options });
  }

  delete(url, options = {}) {
    return this.request.delete(url, { headers: this.headers(), ...options });
  }

  /** Returns a copy of this client that authenticates as the given token. */
  as(token) {
    return new HttpClient(this.request, token);
  }
}

module.exports = { HttpClient };
