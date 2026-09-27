/**
 * Billing and payment data for checkout.
 *
 * Kept as plain constants instead of faker output: the address step is validated
 * against a real postcode-lookup service, and randomly generated postcodes get
 * rejected. A known-good Vienna address keeps the happy path deterministic.
 */
const billingAddress = {
  country: 'AT',
  street: 'Test street 98',
  city: 'Vienna',
  state: 'Vienna',
  postalCode: '1010',
  houseNumber: '12',
};

const bankTransfer = {
  bankName: 'Erste Bank',
  accountName: 'Jane Doe',
  accountNumber: '123456789',
};

const creditCard = {
  // The form validates against a dashed group-of-four format; a bare 16-digit
  // string is rejected with "Invalid card number format."
  number: '4111-1111-1111-1111',
  expiry: '12/2030',
  cvv: '123',
  holder: 'Jane Doe',
};

const paymentMethods = {
  bankTransfer: 'bank-transfer',
  cashOnDelivery: 'cash-on-delivery',
  creditCard: 'credit-card',
  buyNowPayLater: 'buy-now-pay-later',
  giftCard: 'gift-card',
};

module.exports = { billingAddress, bankTransfer, creditCard, paymentMethods };
