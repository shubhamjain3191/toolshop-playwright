const { test, expect } = require('../../src/fixtures/test');

test.describe('Product catalogue', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('shows a grid of products with names and prices @smoke', async ({ homePage }) => {
    const names = await homePage.visibleProductNames();
    const prices = await homePage.visibleProductPrices();

    expect(names.length).toBeGreaterThan(0);
    expect(names).toEqual(names.map((n) => n.trim()).filter(Boolean));
    expect(prices).toHaveLength(names.length);

    for (const price of prices) {
      expect(price).toBeGreaterThan(0);
    }
  });

  test('search narrows the grid to matching products @smoke', async ({ homePage }) => {
    await homePage.search('hammer');

    const names = await homePage.visibleProductNames();
    expect(names.length).toBeGreaterThan(0);

    for (const name of names) {
      expect(name.toLowerCase()).toContain('hammer');
    }
  });

  test('shows an empty state instead of a blank page when nothing matches', async ({ homePage }) => {
    await homePage.search('qwertyuiop');

    await expect(homePage.noResults).toBeVisible();
    await expect(homePage.noResults).toHaveText('There are no products found.');
    await expect(homePage.productCards).toHaveCount(0);
  });

  test('clearing the search brings the full catalogue back', async ({ homePage }) => {
    const before = await homePage.visibleProductNames();

    await homePage.search('hammer');
    expect((await homePage.visibleProductNames()).length).toBeLessThan(before.length);

    await homePage.clearSearch();

    expect(await homePage.visibleProductNames()).toEqual(before);
  });

  test('sorts by price, low to high', async ({ homePage }) => {
    await homePage.sortBy('price,asc');

    const prices = await homePage.visibleProductPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sorts by price, high to low', async ({ homePage }) => {
    await homePage.sortBy('price,desc');

    const prices = await homePage.visibleProductPrices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('sorts by name, Z to A', async ({ homePage }) => {
    await homePage.sortBy('name,desc');

    const names = await homePage.visibleProductNames();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  /**
   * The category checkboxes are keyed by database id, so the ids are read from
   * the API rather than hard-coded - a reseeded environment would otherwise
   * break this test for no good reason.
   */
  test('filtering by category only shows products from that category', async ({ homePage, api }) => {
    const categories = await (await api.products.categories()).json();
    const pliers = categories.find((c) => c.slug === 'pliers');

    await homePage.filterByCategory(pliers.id);

    const names = await homePage.visibleProductNames();
    expect(names.length).toBeGreaterThan(0);

    const expected = await (await api.products.list({ by_category: pliers.id })).json();
    expect(names.sort()).toEqual(expected.data.map((p) => p.name).sort());
  });

  test('pagination moves to the next page of products', async ({ homePage }) => {
    const firstPage = await homePage.visibleProductNames();

    await homePage.goToNextPage();

    const secondPage = await homePage.visibleProductNames();

    expect(secondPage).not.toEqual(firstPage);
    expect(secondPage.filter((n) => firstPage.includes(n))).toHaveLength(0);
  });

  test('out of stock products are labelled as such', async ({ homePage, api }) => {
    const { data } = await (await api.products.list()).json();
    const outOfStock = data.find((p) => !p.in_stock);

    test.skip(!outOfStock, 'no out-of-stock product on the first page right now');

    await expect(
      homePage.productCards.filter({ hasText: outOfStock.name }).getByTestId('out-of-stock')
    ).toBeVisible();
  });
});

test.describe('Product details', () => {
  test('opening a product shows its price and description @smoke', async ({ homePage, productPage, api }) => {
    const expected = await api.products.firstProduct();

    await homePage.open();
    await homePage.openProduct(expected.name);

    await expect(productPage.name).toHaveText(expected.name);
    expect(await productPage.price()).toBe(expected.price);
    await expect(productPage.description).toHaveText(expected.description);
  });

  test('lists the product specifications', async ({ productPage, api }) => {
    const product = await api.products.firstProduct();

    await productPage.open(product.id);

    const specs = await productPage.specifications();
    expect(Object.keys(specs).length).toBeGreaterThan(0);

    for (const [name, value] of Object.entries(specs)) {
      expect(name).not.toBe('');
      expect(value, `specification "${name}" should have a value`).not.toBe('');
    }
  });

  test('quantity cannot be pushed below one', async ({ productPage, api }) => {
    const product = await api.products.firstProduct();
    await productPage.open(product.id);

    await expect(productPage.quantity).toHaveValue('1');

    await productPage.decreaseQuantity.click();

    await expect(productPage.quantity, 'a zero-item order makes no sense').toHaveValue('1');
  });

  test('the increase button steps the quantity up', async ({ productPage, api }) => {
    const product = await api.products.firstProduct();
    await productPage.open(product.id);

    await productPage.increaseQuantity.click();
    await productPage.increaseQuantity.click();

    await expect(productPage.quantity).toHaveValue('3');
  });
});
