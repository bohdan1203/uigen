const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  const input = await page.locator('textarea, input[type="text"]').first();
  await input.click();
  await input.fill('Create a simple button component with hover effect');

  // Submit by pressing Enter
  await input.press('Enter');

  // Keep browser open so the user can watch the result
  await new Promise(() => {});
})();
