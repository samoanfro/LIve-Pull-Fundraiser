import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home", () => {
  it("renders the platform name and a link to campaigns", () => {
    render(<Home />);
    expect(screen.getByText("Live Pull Fundraising")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse campaigns/i }),
    ).toHaveAttribute("href", "/campaigns");
  });
});
