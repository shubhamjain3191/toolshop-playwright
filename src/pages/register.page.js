const { BasePage } = require('./base.page');

class RegisterPage extends BasePage {
  constructor(page) {
    super(page);

    this.form = page.getByTestId('register-form');
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.dateOfBirth = page.getByTestId('dob');
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.phone = page.getByTestId('phone');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('register-submit');

    this.fieldErrors = page.locator('[data-test$="-error"]');
  }

  async open() {
    await this.goto('/auth/register');
    await this.form.waitFor();
  }

  async register(user) {
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.dateOfBirth.fill(user.dateOfBirth);
    await this.country.selectOption(user.address.country);
    await this.street.fill(user.address.street);
    await this.city.fill(user.address.city);
    await this.state.fill(user.address.state);
    await this.postalCode.fill(user.address.postalCode);
    await this.houseNumber.fill(user.address.houseNumber);
    await this.phone.fill(user.phone);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.submit.click();
  }

  async visibleErrors() {
    return (await this.fieldErrors.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }
}

module.exports = { RegisterPage };
