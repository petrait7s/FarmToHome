import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("customers and anonymous visitors cannot reach admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/account\/login/);
  await login(page, "01712345678", "Customer#2026");
  expect((await page.goto("/admin"))!.status()).toBe(404);
  expect((await page.goto("/admin/orders"))!.status()).toBe(404);
});

test("staff can operate but cannot open administrator-only settings", async ({ page }) => {
  await login(page, "01700000002", "Staff#2026demo");
  await expect(page).toHaveURL(/\/admin/);
  expect((await page.goto("/admin/products"))!.status()).toBe(200);
  expect((await page.goto("/admin/settings"))!.status()).toBe(404);
  expect((await page.goto("/admin/team"))!.status()).toBe(404);
});

test("admin dashboard and key screens load", async ({ page }) => {
  await login(page, "admin@farmtohome.test", "Admin#2026demo");
  for (const path of ["/admin", "/admin/orders", "/admin/inventory", "/admin/batches", "/admin/delivery", "/admin/promotions", "/admin/content", "/admin/settings", "/admin/audit"]) {
    expect((await page.goto(path))!.status(), path).toBe(200);
  }
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
