/**
 * The site-wide navigation bar. It behaves differently for anonymous and
 * signed-in users, and collapses behind a hamburger button below the Bootstrap
 * `lg` breakpoint, so the responsive handling lives here rather than leaking
 * into every test that needs to reach a nav link.
 */
class Header {
  constructor(page) {
    this.page = page;

    this.signInLink = page.getByTestId('nav-sign-in');
    this.userMenu = page.getByTestId('nav-menu');
    this.signOutLink = page.getByTestId('nav-sign-out');
    this.myAccountLink = page.getByTestId('nav-my-account');
    this.myFavoritesLink = page.getByTestId('nav-my-favorites');

    this.cartLink = page.getByTestId('nav-cart');
    this.cartQuantity = page.getByTestId('cart-quantity');

    this.homeLink = page.getByTestId('nav-home');
    this.categoriesMenu = page.getByTestId('nav-categories');
    this.handToolsLink = page.getByTestId('nav-hand-tools');
    this.powerToolsLink = page.getByTestId('nav-power-tools');

    this.toggler = page.locator('.navbar-toggler');
    this.collapse = page.locator('#navbarSupportedContent');
  }

  /**
   * Makes sure the nav links are reachable.
   *
   * On a desktop viewport the hamburger is hidden and this does nothing. On a
   * phone the links sit inside a collapsed panel, so anything that asserts on
   * or clicks a nav item has to expand it first. Calling this unconditionally
   * keeps the same test passing on both.
   */
  async openNavigation() {
    if (!(await this.toggler.isVisible())) return;
    if ((await this.toggler.getAttribute('aria-expanded')) === 'true') return;

    await this.toggler.click();
    await this.collapse.waitFor({ state: 'visible' });
  }

  async openCart() {
    await this.cartLink.click();
  }

  /**
   * The badge is removed from the DOM when the cart is empty, which is why this
   * returns 0 instead of failing.
   */
  async cartCount() {
    if ((await this.cartQuantity.count()) === 0) return 0;
    return Number((await this.cartQuantity.innerText()).trim());
  }

  async signOut() {
    await this.openNavigation();
    await this.userMenu.click();
    await this.signOutLink.click();
  }

  async signedInUserName() {
    await this.openNavigation();
    return (await this.userMenu.innerText()).trim();
  }
}

module.exports = { Header };
