const { Header } = require('./components/header.component');

/**
 * Everything every page shares: navigation, the header, and the toast popup the
 * app uses for confirmations.
 */
class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.header = new Header(page);

    // ngx-toastr - no data-test hook on it, so the class name is the only handle.
    this.toast = page.locator('.toast-message').first();
  }

  async goto(path = '/') {
    await this.page.goto(path);
  }

  async toastMessage() {
    await this.toast.waitFor({ state: 'visible' });
    return (await this.toast.innerText()).trim();
  }

  /**
   * The toast auto-dismisses after a few seconds. Waiting for it to go is the
   * difference between a stable suite and one that fails when a toast happens
   * to be covering the button you want to click next.
   */
  async dismissToast() {
    if ((await this.toast.count()) === 0) return;
    await this.toast.click({ trial: false }).catch(() => {});
    await this.toast.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }
}

module.exports = { BasePage };
