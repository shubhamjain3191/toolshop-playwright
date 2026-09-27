/** Catalogue endpoints: products, brands and categories. */
class ProductsApi {
  constructor(http) {
    this.http = http;
  }

  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.http.get(`/products${query ? `?${query}` : ''}`);
  }

  getById(id) {
    return this.http.get(`/products/${id}`);
  }

  search(term) {
    return this.http.get(`/products/search?q=${encodeURIComponent(term)}`);
  }

  /** The API expects the odd `between=price,<min>,<max>` syntax. */
  betweenPrice(min, max) {
    return this.http.get(`/products?between=price,${min},${max}`);
  }

  create(product) {
    return this.http.post('/products', product);
  }

  brands() {
    return this.http.get('/brands');
  }

  categories() {
    return this.http.get('/categories');
  }

  categoryTree() {
    return this.http.get('/categories/tree');
  }

  /** Convenience for tests that just need any real product id. */
  async firstProduct() {
    const response = await this.list();
    const { data } = await response.json();
    return data[0];
  }
}

module.exports = { ProductsApi };
