import { expect, type Page } from "@playwright/test";

export const uniquePhone = () => `019${String(Date.now()).slice(-8)}`;

export async function login(page: Page, identifier: string, password: string) {
  await page.goto("/account/login");
  await page.getByLabel("Phone or email").fill(identifier);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/account/login"));
}

export async function addFromMarket(page: Page, name: string) {
  const row = page.locator("article", { hasText: name }).first();
  const header = row.locator("xpath=ancestor::section[1]").locator("button[aria-expanded]").first();
  if ((await header.getAttribute("aria-expanded")) === "false") await header.click();
  await row.getByRole("button", { name: new RegExp(`^Add ${name.replace(/[()]/g, "\\$&")}`) }).click();
  await expect(row.getByRole("group", { name: new RegExp(`${name.replace(/[()]/g, "\\$&")}: Quantity`) })).toBeVisible();
}

export async function cartCount(page: Page): Promise<number> {
  const res = await page.request.get("/api/cart");
  return (await res.json()).cart.productCount;
}
