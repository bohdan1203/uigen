const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const scratchDir = 'C:\\Users\\BOHDAN~1\\AppData\\Local\\Temp\\claude\\C--Users-BohdanKatsenko-Desktop-Practice-uigen\\dc9d4423-1240-473b-b3d5-10b09e5eb6f7\\scratchpad';
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  console.log('Navigating to localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(scratchDir, 'step1_loaded.png') });
  console.log('Step 1: Page loaded');

  // Find the textarea input
  const textarea = page.locator('textarea').first();
  await textarea.waitFor({ timeout: 10000 });
  await textarea.click();
  await page.waitForTimeout(300);

  const prompt = 'Generate a beautiful pricing card component with three tiers: Basic, Pro, and Enterprise. Use a dark theme with gradient accents and a "Get Started" button for each tier.';
  await textarea.fill(prompt);
  await page.screenshot({ path: path.join(scratchDir, 'step2_typed.png') });
  console.log('Step 2: Prompt typed');

  // Submit with Enter
  await textarea.press('Enter');
  await page.screenshot({ path: path.join(scratchDir, 'step3_submitted.png') });
  console.log('Step 3: Submitted');

  // Wait for generation — look for streaming indicator then wait for it to stop
  console.log('Waiting for AI generation (up to 60s)...');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(scratchDir, 'step4_generating.png') });
  console.log('Step 4: Mid-generation screenshot');

  // Keep waiting for the preview to render
  // Use small increments and catch any navigation-related errors
  for (let i = 0; i < 7; i++) {
    try {
      await page.waitForTimeout(5000);
      await page.screenshot({ path: path.join(scratchDir, `step5_final_${i}.png`) });
      console.log(`Step 5.${i}: Screenshot taken`);
    } catch (e) {
      console.log(`Step 5.${i}: Error - ${e.message}`);
      break;
    }
  }

  await browser.close();
  console.log('Done!');
})();
