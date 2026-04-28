const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test 10: Customer Views My Orders
  await page.goto('http://localhost:3000/account/orders');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: './public/e2e-screenshots/10-customer-my-orders.png' });

  await browser.close();
})();
