import { test, expect } from "@playwright/test";

test("home page loads and links to campaigns", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Live Pull Fundraising")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /browse campaigns/i }),
  ).toBeVisible();
});
