import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home", () => {
  it("renders the platform name and a link to campaigns", () => {
    render(<Home />);
    expect(screen.getAllByText("Live Pull Fundraising")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /browse campaigns/i }),
    ).toHaveAttribute("href", "/campaigns");
    expect(
      screen.getByRole("heading", { name: /every pack has a story/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /from sealed pack to verified outcome/i }),
    ).toBeInTheDocument();
  });
});
