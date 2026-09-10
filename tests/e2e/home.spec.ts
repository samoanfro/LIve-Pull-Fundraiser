import { test, expect } from "@playwright/test";

test("home page loads and shows the platform name", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText("Live Pull Fundraising Platform"),
  ).toBeVisible();
});
