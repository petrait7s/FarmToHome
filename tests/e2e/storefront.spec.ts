import { expect, test } from "@playwright/test";
import { addFromMarket, cartCount } from "./helpers";

test("home communicates the brand and routes to the market", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("fields, rivers and towns");
  await expect(page.getByText("Demo", { exact: false }).first()).toBeVisible();
  await page.getByRole("link", { name: /Build Your Market/ }).click();
  await expect(page).toHaveURL(/\/market\/weekly/);
});

test("explore search and category filter", async ({ page }) => {
  await page.goto("/explore?q=bogura");
  await expect(page.getByText("2 products")).toBeVisible();
  await page.goto("/explore?category=pulses-lentils");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pulses & Lentils");
  await expect(page.getByRole("heading", { name: "Deshi Masoor Dal" })).toBeVisible();
});

test("product page adds to market and links to the batch journey", async ({ page }) => {
  await page.goto("/products/miniket-rice");
  await page.getByRole("radiogroup", { name: "Pack size", exact: true }).getByRole("radio", { name: /^10 kg/ }).click();
  await page.getByRole("button", { name: "Add to market" }).click();
  await expect(page.getByText("In your market")).toBeVisible();
  await expect.poll(() => cartCount(page)).toBeGreaterThan(0);
  await page.getByRole("link", { name: /See this batch’s full journey/ }).click();
  await expect(page.getByRole("heading", { name: "The journey" })).toBeVisible();
  await expect(page.getByText(/demonstration data/i).first()).toBeVisible();
});

test("weekly market: add, change size, quantity and undo removal", async ({ page }) => {
  await page.goto("/market/weekly");
  await addFromMarket(page, "Miniket Rice");
  const row = page.locator("article", { hasText: "Miniket Rice" }).first();
  await row.getByRole("button", { name: "Increase Miniket Rice" }).click();
  await row.getByRole("radio", { name: "10 kg" }).click();
  await expect(page.locator("#mb-sum-count")).toHaveText(/1 product/);
  await expect(page.locator("aside").getByText("10 kg × 2")).toBeVisible();
  await row.getByRole("button", { name: "Decrease Miniket Rice" }).click();
  await row.getByRole("button", { name: "Remove Miniket Rice" }).click();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("aside").getByText(/10 kg × 1/)).toBeVisible();
});

test("monthly stock excludes fresh fish and preselects bulk sizes", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/market/monthly");
  await expect(page.locator("article", { hasText: "Rui (Rohu)" })).toHaveCount(0);
  await expect(page.locator("article", { hasText: "Miniket Rice" }).first().getByRole("radio", { checked: true })).toHaveText("25 kg");
});

test("language switch to Bangla persists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Language/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await page.goto("/explore");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("বাজার ঘুরে দেখুন");
  await page.getByRole("button", { name: /ভাষা/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
