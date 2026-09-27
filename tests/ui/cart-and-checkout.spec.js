const { test, expect } = require('../../src/fixtures/test');
const { billingAddress, bankTransfer, creditCard } = require('../../src/data/checkout.data');

test.describe('Shopping cart', () => {
  test('adding a product updates the cart badge @smoke', async ({ productPage, api }) => {
    const product = await api.products.firstProduct();

    await productPage.open(product.id);
    expect(await productPage.header.cartCount()).toBe(0);

    await productPage.addToCartAndWait();

    expect(await productPage.toastMessage()).toBe('Product added to shopping cart.');
    await expect(productPage.header.cartQuantity).toHaveText('1');
  });

  test('the cart lists the product that was added', async ({ productPage, checkoutPage, api }) => {
    const product = await api.products.firstProduct();

    await productPage.open(product.id);
    await productPage.addToCartAndWait();
    await productPage.dismissToast();

    await checkoutPage.open();

    await expect(checkoutPage.productTitle).toHaveText(product.name);
    await expect(checkoutPage.productQuantity).toHaveValue('1');
    expect(await checkoutPage.totalAmount()).toBeCloseTo(product.price, 2);
  });

  test('adding a quantity of three carries through to the cart', async ({
    productPage,
    checkoutPage,
    api,
  }) => {
    const product = await api.products.firstProduct();

    await productPage.open(product.id);
    await productPage.setQuantity(3);
    await productPage.addToCartAndWait();
    await productPage.dismissToast();

    await checkoutPage.open();

    await expect(checkoutPage.productQuantity).toHaveValue('3');
    expect(await checkoutPage.totalAmount()).toBeCloseTo(product.price * 3, 2);
  });

  test('changing the quantity in the cart recalculates the total', async ({
    productPage,
    checkoutPage,
    api,
  }) => {
    const product = await api.products.firstProduct();

    await productPage.open(product.id);
    await productPage.addToCartAndWait();
    await productPage.dismissToast();

    await checkoutPage.open();
    await checkoutPage.updateQuantity(0, 4);

    await expect
      .poll(() => checkoutPage.totalAmount(), { message: 'cart total should follow the quantity' })
      .toBeCloseTo(product.price * 4, 2);
  });

  test('two different products both end up in the cart', async ({ productPage, checkoutPage, api }) => {
    const { data } = await (await api.products.list()).json();
    const [first, second] = data;

    await productPage.open(first.id);
    await productPage.addToCartAndWait();
    await productPage.dismissToast();

    await productPage.open(second.id);
    await productPage.addToCartAndWait();
    await productPage.dismissToast();

    await checkoutPage.open();

    expect(await checkoutPage.lineItemCount()).toBe(2);
    await expect(checkoutPage.productTitle).toHaveText([first.name, second.name]);
    expect(await checkoutPage.totalAmount()).toBeCloseTo(first.price + second.price, 2);
  });

  test('the cart survives a page reload', async ({ productPage, page, api }) => {
    const product = await api.products.firstProduct();

    await productPage.open(product.id);
    await productPage.addToCartAndWait();

    await page.reload();

    await expect(productPage.header.cartQuantity).toHaveText('1');
  });
});

test.describe('Checkout', () => {
  test('a signed-in customer can place an order end to end @smoke', async ({
    signInAsCustomer,
    productPage,
    checkoutPage,
    api,
  }) => {
    await signInAsCustomer();

    const product = await api.products.firstProduct();

    await productPage.open(product.id);
    await productPage.addToCartAndWait();
    await productPage.dismissToast();

    await checkoutPage.open();
    expect(await checkoutPage.totalAmount()).toBeCloseTo(product.price, 2);

    await checkoutPage.proceedToSignIn();
    await checkoutPage.proceedToBillingAddress();

    await checkoutPage.fillBillingAddress(billingAddress);
    await checkoutPage.proceedToPayment();

    await checkoutPage.payWithBankTransfer(bankTransfer);
    await checkoutPage.confirmOrder();

    await expect(checkoutPage.paymentSuccess).toHaveText('Payment was successful');
  });

  test('a credit card order is also accepted', async ({
    signInAsCustomer,
    productPage,
    checkoutPage,
    api,
  }) => {
    await signInAsCustomer();

    const product = await api.products.firstProduct();

    await productPage.open(product.id);
    await productPage.addToCartAndWait();
    await productPage.dismissToast();

    await checkoutPage.open();
    await checkoutPage.proceedToSignIn();
    await checkoutPage.proceedToBillingAddress();
    await checkoutPage.fillBillingAddress(billingAddress);
    await checkoutPage.proceedToPayment();

    await checkoutPage.payWithCreditCard(creditCard);
    await checkoutPage.confirmOrder();

    await expect(checkoutPage.paymentSuccess).toBeVisible();
  });

  test('the address step blocks progress until it is complete', async ({
    signInAsCustomer,
    productPage,
    checkoutPage,
    api,
  }) => {
    await signInAsCustomer();

    const product = await api.products.firstProduct();

    await productPage.open(product.id);
    await productPage.addToCartAndWait();
    await productPage.dismissToast();

    await checkoutPage.open();
    await checkoutPage.proceedToSignIn();
    await checkoutPage.proceedToBillingAddress();

    // The seeded account has a street and city but no postal code, so the step
    // starts out incomplete even for a returning customer.
    await checkoutPage.postalCode.fill('');
    await checkoutPage.street.fill('');

    await expect(checkoutPage.proceed3).toBeDisabled();

    await checkoutPage.fillBillingAddress(billingAddress);

    await expect(checkoutPage.proceed3).toBeEnabled();
  });

  test('an anonymous shopper is asked to sign in before paying', async ({
    productPage,
    checkoutPage,
    api,
  }) => {
    const product = await api.products.firstProduct();

    await productPage.open(product.id);
    await productPage.addToCartAndWait();
    await productPage.dismissToast();

    await checkoutPage.open();
    await checkoutPage.proceedToSignIn();

    // Step 2 renders the login form rather than the "already signed in" message.
    await expect(checkoutPage.signInEmail).toBeVisible();
    await expect(checkoutPage.signInPassword).toBeVisible();
    await expect(checkoutPage.signInSubmit).toBeVisible();
  });
});
