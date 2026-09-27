const { BasePage } = require('./base.page');

class ProductPage extends BasePage {
  constructor(page) {
    super(page);

    this.name = page.getByTestId('product-name');
    this.unitPrice = page.getByTestId('unit-price');
    this.description = page.getByTestId('product-description');
    this.co2Badge = page.getByTestId('co2-rating-badge');

    this.quantity = page.getByTestId('quantity');
    this.increaseQuantity = page.getByTestId('increase-quantity');
    this.decreaseQuantity = page.getByTestId('decrease-quantity');

    this.addToCart = page.getByTestId('add-to-cart');
    this.addToFavourites = page.getByTestId('add-to-favorites');
    this.addToCompare = page.getByTestId('add-to-compare');

    this.specsTable = page.getByTestId('product-specs');
    this.specRows = page.getByTestId('spec-row');
  }

  async open(productId) {
    await this.goto(`/product/${productId}`);
    await this.name.waitFor();
  }

  async price() {
    return Number((await this.unitPrice.innerText()).replace(/[^0-9.]/g, ''));
  }

  async setQuantity(value) {
    await this.quantity.fill(String(value));
  }

  /**
   * Adds to the cart and waits for the confirmation toast, so the caller knows
   * the cart state has actually been committed before asserting on the badge.
   */
  async addToCartAndWait() {
    await this.addToCart.click();
    await this.toast.waitFor({ state: 'visible' });
  }

  /** Returns the specifications table as a plain { name: value } object. */
  async specifications() {
    const rows = await this.specRows.all();
    const specs = {};

    for (const row of rows) {
      const key = (await row.getByTestId('spec-name').innerText()).trim();
      specs[key] = (await row.getByTestId('spec-value').innerText()).trim();
    }

    return specs;
  }
}

module.exports = { ProductPage };
