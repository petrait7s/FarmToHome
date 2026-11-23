import { expect, test } from "@playwright/test";
import { addFromMarket } from "./helpers";

test("mobile: bottom navigation, basket bar and summary sheet", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "Market" }).click();
  await expect(page).toHaveURL(/\/market\/weekly/);
  await addFromMarket(page, "Miniket Rice");
  await expect(page.locator("#mb-bar-count")).toHaveText("1");
  await page.getByRole("button", { name: /View my market/ }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("Miniket Rice")).toBeVisible();
  await sheet.getByRole("button", { name: "Close" }).click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("mobile: pages have no horizontal overflow", async ({ page }) => {
  for (const path of ["/", "/explore", "/products/miniket-rice", "/market/monthly", "/basket", "/journey", "/concierge", "/account/login"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
