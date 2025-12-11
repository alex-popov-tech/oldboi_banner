import { chromium, Page, expect } from "@playwright/test";
import { createLogger } from "./logger";

const logger = createLogger("monobank");

async function getSubscribers(
  page: Page,
): Promise<{ value: number } | { error: Error }> {
  const element = page
    .locator("h1")
    .filter({ hasText: "OLDboi" })
    .locator("xpath=following-sibling::div[1]");
  try {
    await expect(element).toHaveText(/\d+/);
  } catch (error) {
    return { error: error as Error };
  }

  return {
    value: parseInt(
      await element.textContent().then((it) => it!.split(" ")[0]),
      10,
    ),
  };
}

export async function init() {
  logger.log("init started");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://base.monobank.ua/oldboi");
  const initialCount = await getSubscribers(page);
  if ("error" in initialCount) {
    throw new Error(
      `Failed to initialize monobank client: \n${initialCount.error}`,
    );
  }

  logger.log("init finished");
  return {
    get: async (): Promise<{ value: number } | { error: Error }> => {
      await page.reload();
      return await getSubscribers(page);
    },
  };
}
