const { BasePage } = require('./base.page');

/**
 * Checkout is a four-step wizard (Cart -> Sign in -> Billing address -> Payment)
 * rendered as a single Angular component. Every step's markup is present in the
 * DOM the whole time, so "is the button visible / enabled" is the only reliable
 * way to know which step is active - a plain click() on a later step's button
 * will silently target a hidden element.
 */
class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);

    // Step 1 - cart
    this.cartRows = page.locator('tbody tr');
    this.productTitle = page.getByTestId('product-title');
    this.productQuantity = page.getByTestId('product-quantity');
    this.productPrice = page.getByTestId('product-price');
    this.linePrice = page.getByTestId('line-price');
    this.cartTotal = page.getByTestId('cart-total');
    this.continueShopping = page.getByTestId('continue-shopping');
    this.proceed1 = page.getByTestId('proceed-1');

    // Step 2 - sign in. Shows a "you are already logged in" button for an
    // authenticated customer, and the login form for everyone else.
    this.proceed2 = page.getByTestId('proceed-2');
    this.signInEmail = page.getByTestId('email');
    this.signInPassword = page.getByTestId('password');
    this.signInSubmit = page.getByTestId('login-submit');

    // Step 3 - billing address
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.proceed3 = page.getByTestId('proceed-3');

    // Step 4 - payment
    this.paymentMethod = page.getByTestId('payment-method');
    this.finish = page.getByTestId('finish');
    this.paymentSuccess = page.getByTestId('payment-success-message');
  }

  async open() {
    await this.goto('/checkout');
    await this.proceed1.waitFor();
  }

  async totalAmount() {
    return Number((await this.cartTotal.innerText()).replace(/[^0-9.]/g, ''));
  }

  async lineItemCount() {
    return this.productTitle.count();
  }

  async updateQuantity(rowIndex, value) {
    const field = this.productQuantity.nth(rowIndex);
    await field.fill(String(value));
    // The line total recalculates on blur, not on keystroke.
    await field.press('Tab');
  }

  /**
   * Advances from the cart to the sign-in step. Which control appears there
   * depends on whether the shopper is authenticated, so this waits for either
   * and leaves it to the caller to decide what to do next.
   */
  async proceedToSignIn() {
    await this.proceed1.click();
    await this.proceed2.or(this.signInSubmit).first().waitFor({ state: 'visible' });
  }

  async signInDuringCheckout(email, password) {
    await this.signInEmail.fill(email);
    await this.signInPassword.fill(password);
    await this.signInSubmit.click();
  }

  async proceedToBillingAddress() {
    await this.proceed2.click();
    await this.street.waitFor({ state: 'visible' });
  }

  /**
   * "Proceed" on the address step stays disabled until every required field is
   * populated. The demo account ships with a partially filled address (no postal
   * code), so the form has to be completed even for a returning customer.
   */
  async fillBillingAddress(address) {
    await this.country.selectOption(address.country);
    await this.street.fill(address.street);
    await this.city.fill(address.city);
    await this.state.fill(address.state);
    await this.postalCode.fill(address.postalCode);

    if (address.houseNumber) {
      await this.houseNumber.fill(address.houseNumber);
    }
  }

  async proceedToPayment() {
    await this.proceed3.click();
    await this.paymentMethod.waitFor({ state: 'visible' });
  }

  async payWithBankTransfer({ bankName, accountName, accountNumber }) {
    await this.paymentMethod.selectOption('bank-transfer');
    await this.page.getByTestId('bank_name').fill(bankName);
    await this.page.getByTestId('account_name').fill(accountName);
    await this.page.getByTestId('account_number').fill(accountNumber);
  }

  async payWithCreditCard({ number, expiry, cvv, holder }) {
    await this.paymentMethod.selectOption('credit-card');
    await this.page.getByTestId('credit_card_number').fill(number);
    await this.page.getByTestId('expiration_date').fill(expiry);
    await this.page.getByTestId('cvv').fill(cvv);
    await this.page.getByTestId('card_holder_name').fill(holder);
  }

  async confirmOrder() {
    await this.finish.click();
    await this.paymentSuccess.waitFor({ state: 'visible' });
  }
}

module.exports = { CheckoutPage };
