require('dotenv').config({ quiet: true });

/**
 * Single place that reads process.env, so nothing else in the suite has to.
 * Defaults point at the public demo instance; override them in .env when you
 * run the Tool Shop locally via docker-compose.
 */
const env = {
  uiBaseUrl: process.env.UI_BASE_URL || 'https://practicesoftwaretesting.com',
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.practicesoftwaretesting.com',

  customer: {
    email: process.env.CUSTOMER_EMAIL || 'customer@practicesoftwaretesting.com',
    password: process.env.CUSTOMER_PASSWORD || 'welcome01',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@practicesoftwaretesting.com',
    password: process.env.ADMIN_PASSWORD || 'welcome01',
  },
};

module.exports = { env };
