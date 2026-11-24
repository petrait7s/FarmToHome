import { expect, test } from "@playwright/test";
import { addFromMarket, login, uniquePhone } from "./helpers";

async function fillCheckout(page: import("@playwright/test").Page, phone: string) {
  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("E2E Household");
  await page.getByLabel("Phone number").fill(phone);
  const area = page.getByLabel("Area");
  if (await area.isEnabled()) {
    await area.selectOption("Amberkhana");
    await page.getByLabel("House, road and block").fill("House 1, Road 2, Amberkhana");
  }
  await page.locator("[aria-labelledby=slot-label] button:not([disabled])").first().click();
}

test("guest checkout with cash on delivery, tracking link and cancellation", async ({ page, browser }) => {
  await page.goto("/market/weekly");
  await addFromMarket(page, "Miniket Rice");
  await addFromMarket(page, "Haor Pabda");
  await fillCheckout(page, uniquePhone());
  await page.getByRole("button", { name: "Place order" }).click();
  await page.waitForURL(/\/orders\/FTH-/);
  await expect(page.getByRole("heading", { name: "We’ve received your order." })).toBeVisible();
  const ref = page.url().match(/FTH-\d{6}-[A-Z0-9]{5}/)![0];

  // Without the secret link token the order is not visible.
  const other = await browser.newPage();
  expect((await other.goto(`/orders/${ref}`))!.status()).toBe(404);
  await other.close();

  await page.getByRole("button", { name: "Cancel order" }).click();
  await expect(page.getByText("Order cancelled")).toBeVisible();
});

test("simulated mobile payment is clearly labelled and records the outcome", async ({ page }) => {
  await page.goto("/market/weekly");
  await addFromMarket(page, "Fresh Golda Prawns");
  await fillCheckout(page, uniquePhone());
  await page.getByRole("radio", { name: /Mobile banking/ }).click();
  await page.getByRole("button", { name: "Place order" }).click();
  await page.waitForURL(/\/pay\//);
  await expect(page.getByText("No money moves")).toBeVisible();
  await page.getByRole("button", { name: "Mark as successful" }).click();
  await page.waitForURL(/\/orders\//);
  await expect(page.getByText("Paid")).toBeVisible();
});

test("register, save a market, repeat it and manage an address", async ({ page }) => {
  const phone = uniquePhone();
  await page.goto("/account/register");
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Phone number").fill(phone);
  await page.getByLabel("Password", { exact: true }).fill("Testing#1234");
  await page.getByLabel("Confirm password").fill("Testing#1234");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);

  await page.goto("/market/weekly");
  await addFromMarket(page, "Deshi Masoor Dal");
  await addFromMarket(page, "Cold-Pressed Mustard Oil");
  await page.locator("aside").getByRole("button", { name: "Save market" }).click();
  await page.getByLabel("Market name").fill("E2E Weekly");
  await page.getByRole("dialog").getByRole("button", { name: "Save market" }).click();
  await expect(page.getByText("Saved as “E2E Weekly”")).toBeVisible();

  await page.locator("aside").getByRole("button", { name: "Clear all" }).click();
  await page.goto("/account/markets");
  await expect(page.getByRole("heading", { name: "E2E Weekly" })).toBeVisible();
  await page.getByRole("button", { name: /Load again \(replaces basket\)/ }).click();
  await page.waitForURL(/\/basket/);
  await expect(page.getByText("Deshi Masoor Dal")).toBeVisible();

  await page.goto("/account/addresses");
  await page.getByRole("button", { name: "Add address" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Recipient").fill("E2E Customer");
  await dialog.getByLabel("Phone number").fill(phone);
  await dialog.getByLabel("Area").selectOption("Shibganj");
  await dialog.getByLabel("House, road and block").fill("House 5, Road 11, Shibganj");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("House 5, Road 11, Shibganj")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await login(page, phone, "Testing#1234");
  await expect(page).toHaveURL(/\/account/);
});

test("wrong password is rejected without revealing whether the account exists", async ({ page }) => {
  await page.goto("/account/login");
  await page.getByLabel("Phone or email").fill("01712345678");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".form-error")).toHaveText("Phone/email or password is incorrect.");
});
