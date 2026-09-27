const { expect } = require('@playwright/test');

const { BasePage } = require('./base.page');

/**
 * The product catalogue - the app's landing page. Search, sorting, category and
 * brand filters all live here and all re-render the same product grid.
 */
class HomePage extends BasePage {
  constructor(page) {
    super(page);

    this.searchInput = page.getByTestId('search-query');
    this.searchButton = page.getByTestId('search-submit');
    this.searchReset = page.getByTestId('search-reset');
    this.noResults = page.getByTestId('no-results');

    this.sortDropdown = page.getByTestId('sort');
    this.ecoFriendlyFilter = page.getByTestId('eco-friendly-filter');

    // Below the `lg` breakpoint the search box and filters collapse behind this
    // toggle, so they have to be revealed before they can be used.
    this.filtersToggle = page.locator('a[data-test="filters"]');

    this.productCards = page.locator('a[data-test^="product-"]');
    this.productNames = page.getByTestId('product-name');
    this.productPrices = page.getByTestId('product-price');

    this.paginationNext = page.getByTestId('pagination-next');
    this.paginationPrev = page.getByTestId('pagination-prev');
  }

  async open() {
    await this.goto('/');
    await this.productCards.first().waitFor({ state: 'visible' });
  }

  /**
   * Runs an action that re-queries the catalogue, then blocks until the grid on
   * screen actually reflects the new response.
   *
   * Every filter on this page replaces the contents of a grid that is already
   * populated, so "wait for a product card to be visible" returns immediately
   * and hands back the *previous* results. Reading the payload the app just
   * received and asserting the DOM matches it is the only thing that reliably
   * tells us the re-render has finished - and it removes the need for sleeps.
   *
   * Note the method check: the front end issues these as HTTP QUERY (the draft
   * standard for a request body on a read), not GET, so a naive
   * `method() === 'GET'` predicate silently never matches.
   */
  async applyAndWaitForResults(action) {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) =>
          /\/products(\/search)?$/.test(new URL(r.url()).pathname) &&
          ['GET', 'QUERY', 'POST'].includes(r.request().method())
      ),
      action(),
    ]);

    const body = await response.json();
    const names = (body.data ?? []).map((p) => p.name);

    if (names.length === 0) {
      await this.noResults.waitFor({ state: 'visible' });
    } else {
      await expect(this.productNames).toHaveText(names);
    }

    return body;
  }

  /** No-op on a desktop viewport; expands the filter panel on a phone. */
  async openFilters() {
    if (await this.searchInput.isVisible()) return;

    await this.filtersToggle.click();
    await this.searchInput.waitFor({ state: 'visible' });
  }

  async search(term) {
    await this.openFilters();
    await this.searchInput.fill(term);
    return this.applyAndWaitForResults(() => this.searchButton.click());
  }

  async clearSearch() {
    await this.openFilters();
    return this.applyAndWaitForResults(() => this.searchReset.click());
  }

  async sortBy(optionValue) {
    await this.openFilters();
    return this.applyAndWaitForResults(() => this.sortDropdown.selectOption(optionValue));
  }

  async filterByCategory(categoryId) {
    await this.openFilters();
    return this.applyAndWaitForResults(() => this.page.getByTestId(`category-${categoryId}`).check());
  }

  async filterByBrand(brandId) {
    await this.openFilters();
    return this.applyAndWaitForResults(() => this.page.getByTestId(`brand-${brandId}`).check());
  }

  async goToNextPage() {
    return this.applyAndWaitForResults(() => this.paginationNext.click());
  }

  async openProduct(name) {
    await this.productCards.filter({ hasText: name }).first().click();
  }

  async openFirstProduct() {
    await this.productCards.first().click();
  }

  async visibleProductNames() {
    return (await this.productNames.allInnerTexts()).map((t) => t.trim());
  }

  /** Prices render as "$14.15"; tests want to compare numbers. */
  async visibleProductPrices() {
    const raw = await this.productPrices.allInnerTexts();
    return raw.map((t) => Number(t.replace(/[^0-9.]/g, '')));
  }
}

module.exports = { HomePage };
