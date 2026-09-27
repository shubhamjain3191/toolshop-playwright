const { BasePage } = require('./base.page');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    this.form = page.getByTestId('login-form');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('login-submit');

    this.loginError = page.getByTestId('login-error');
    this.registerLink = page.getByTestId('register-link');
    this.forgotPasswordLink = page.getByTestId('forgot-password-link');

    // Per-field validation. The app renders these as `<div data-test="x-error">`
    // rather than using Bootstrap's usual .invalid-feedback class.
    this.emailError = page.getByTestId('email-error');
    this.passwordError = page.getByTestId('password-error');
    this.fieldErrors = page.locator('[data-test$="-error"]');
  }

  async open() {
    await this.goto('/auth/login');
    await this.form.waitFor();
  }

  async login(email, password) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  /**
   * Signs in and waits for the redirect, so callers do not have to remember
   * that a successful login lands on /account.
   */
  async loginAndWait(email, password) {
    await this.login(email, password);
    await this.page.waitForURL('**/account');
  }

  async errorMessage() {
    return (await this.loginError.innerText()).trim();
  }
}

module.exports = { LoginPage };
