import {
  chromium,
  Page,
  expect,
  Browser,
  BrowserContext,
} from "@playwright/test";
import { createLogger } from "./logger";

async function openBrowser(args: {
  headless: boolean;
}): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  const browser = await chromium.launch({
    headless: args.headless,
    channel: "msedge",
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox", // May help in some environments
      "--disable-web-security", // Not recommended for production use
      "--disable-infobars", // Prevent infobars
      "--disable-extensions", // Disable extensions
      "--start-maximized", // Start maximized
      "--window-size=1280,720", // Set a specific window size
    ],
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  return { browser, context, page };
}

async function getSponsors(
  page: Page,
): Promise<{ value: number } | { error: Error }> {
  const element = page.locator("#total-sponsors-card > p");
  try {
    await expect(element).toHaveText(/\d+/, { timeout: 20_000 });
  } catch (error) {
    return { error: error as Error };
  }

  const textContent = await element.textContent();
  const value = parseInt(textContent!.trim(), 10);
  if (!value) {
    return { error: new Error(`Cannot parse number from: ${textContent}`) };
  }
  return { value };
}

export async function init(args: { url: string; name: string }): Promise<{
  get: () => Promise<{ value: number } | { error: Error }>;
}> {
  const { url, name } = args;
  const logger = createLogger(`youtube:${name}`);
  const stateFilePath = `${name}_state.json`;

  logger.log("init started");

  // Phase 1: Headed mode for manual login
  logger.log(`Launching browser for account: ${name}`);
  let { browser, context, page } = await openBrowser({ headless: false });
  await page.goto("https://www.youtube.com");

  logger.log("Waiting for studio.youtube.com (timeout: 10 minutes)...");
  try {
    await page.waitForURL("https://studio.youtube.com/**", {
      timeout: 600000,
    }); // 10 minutes
    logger.log("Studio page detected! Saving storage state...");
  } catch (error) {
    await browser.close();
    throw new Error(`Cannot setup youtube account ${name}`);
  }

  await context.storageState({ path: stateFilePath });
  logger.log(`Storage state saved to ${name}_state.json`);
  await browser.close();
  logger.log("Headed browser closed");

  // Phase 2: Headless mode with saved state
  logger.log("Launching headless browser with saved state...");
  ({ browser, context, page } = await openBrowser({ headless: false }));
  logger.log(`Navigating to ${url}...`);
  await page.goto(url);

  // Verify initial access
  const initialCount = await getSponsors(page);
  if ("error" in initialCount) {
    await browser.close();
    throw new Error(
      `Failed to initialize YouTube client for ${name}: \n${initialCount.error}`,
    );
  }

  logger.log(
    `Successfully initialized! Initial sponsors: ${initialCount.value}`,
  );
  logger.log("init finished");

  return {
    get: async (): Promise<{ value: number } | { error: Error }> => {
      await page.reload();
      return await getSponsors(page);
    },
  };
}
