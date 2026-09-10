import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home", () => {
  it("renders the platform name", () => {
    render(<Home />);
    expect(
      screen.getByText("Live Pull Fundraising Platform"),
    ).toBeInTheDocument();
  });
});
