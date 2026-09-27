const { test, expect } = require('../../src/fixtures/test');
const { expectValidSchema } = require('../../src/utils/validate');
const { productSchema, paginatedSchema, brandSchema, categoryTreeSchema } = require('../../src/api/schemas');

test.describe('Catalogue API', () => {
  test('returns a paginated list of products @smoke', async ({ api }) => {
    const response = await api.products.list();

    expect(response.status()).toBe(200);

    const body = await response.json();
    expectValidSchema(paginatedSchema(productSchema), body, 'GET /products');

    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.length).toBeLessThanOrEqual(body.per_page);
    expect(body.total).toBeGreaterThanOrEqual(body.data.length);
  });

  test('serves a second page with different products', async ({ api }) => {
    const [first, second] = await Promise.all([
      api.products.list({ page: 1 }),
      api.products.list({ page: 2 }),
    ]);

    const pageOne = await first.json();
    const pageTwo = await second.json();

    expect(pageOne.current_page).toBe(1);
    expect(pageTwo.current_page).toBe(2);

    const idsOnPageOne = pageOne.data.map((p) => p.id);
    const overlap = pageTwo.data.filter((p) => idsOnPageOne.includes(p.id));

    expect(overlap, 'pages should not repeat products').toHaveLength(0);
  });

  test('retrieves a single product by id', async ({ api }) => {
    const expected = await api.products.firstProduct();

    const response = await api.products.getById(expected.id);
    expect(response.status()).toBe(200);

    const product = await response.json();
    expectValidSchema(productSchema, product, `GET /products/${expected.id}`);

    expect(product.id).toBe(expected.id);
    expect(product.name).toBe(expected.name);
    expect(product.price).toBe(expected.price);
  });

  test('responds 404 for a product that does not exist', async ({ api }) => {
    const response = await api.products.getById('this-id-does-not-exist');

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Requested item not found' });
  });

  test('search only returns products matching the term @smoke', async ({ api }) => {
    const response = await api.products.search('hammer');
    expect(response.status()).toBe(200);

    const { data } = await response.json();
    expect(data.length).toBeGreaterThan(0);

    for (const product of data) {
      expect(
        product.name.toLowerCase(),
        `"${product.name}" was returned for the search term "hammer"`
      ).toContain('hammer');
    }
  });

  test('search returns an empty result set rather than an error', async ({ api }) => {
    const response = await api.products.search('nosuchtoolexists');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  test('price filter keeps every product inside the requested range', async ({ api }) => {
    const response = await api.products.betweenPrice(1, 10);
    expect(response.status()).toBe(200);

    const { data } = await response.json();
    expect(data.length).toBeGreaterThan(0);

    for (const product of data) {
      expect(product.price).toBeGreaterThanOrEqual(1);
      expect(product.price).toBeLessThanOrEqual(10);
    }
  });

  test('exposes brands', async ({ api }) => {
    const response = await api.products.brands();
    expect(response.status()).toBe(200);

    const brands = await response.json();
    expect(brands.length).toBeGreaterThan(0);

    for (const brand of brands) {
      expectValidSchema(brandSchema, brand, 'GET /brands item');
    }
  });

  test('exposes categories as a parent/child tree', async ({ api }) => {
    const response = await api.products.categoryTree();
    expect(response.status()).toBe(200);

    const tree = await response.json();
    expect(tree.length).toBeGreaterThan(0);

    for (const node of tree) {
      expectValidSchema(categoryTreeSchema, node, 'GET /categories/tree item');
      expect(node.parent_id, 'top-level categories should not have a parent').toBeNull();
    }

    const withChildren = tree.filter((n) => (n.sub_categories ?? []).length > 0);
    expect(withChildren.length, 'at least one category should have sub-categories').toBeGreaterThan(0);

    for (const parent of withChildren) {
      for (const child of parent.sub_categories) {
        expect(child.parent_id).toBe(parent.id);
      }
    }
  });
});
