import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CartPage from "@/app/(storefront)/cart/page";

const setQuantity = vi.fn();
const removeItem = vi.fn();

vi.mock("@/lib/cart/cart-context", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cart/cart-context")>(
    "@/lib/cart/cart-context",
  );
  return {
    ...actual,
    useCart: () => ({
      items: [
        {
          productId: "product-1",
          organizationId: "org-1",
          name: "Collector Pack",
          priceCents: 2900,
          quantity: 2,
        },
      ],
      setQuantity,
      removeItem,
      totalCents: 5800,
    }),
  };
});

describe("CartPage", () => {
  beforeEach(() => {
    setQuantity.mockClear();
    removeItem.mockClear();
  });

  it("updates quantity with stable stepper controls", () => {
    render(<CartPage />);

    fireEvent.click(
      screen.getByRole("button", { name: /increase collector pack quantity/i }),
    );
    expect(setQuantity).toHaveBeenCalledWith("product-1", 3);

    fireEvent.click(
      screen.getByRole("button", { name: /decrease collector pack quantity/i }),
    );
    expect(setQuantity).toHaveBeenCalledWith("product-1", 1);
  });

  it("removes an item explicitly", () => {
    render(<CartPage />);
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(removeItem).toHaveBeenCalledWith("product-1");
  });
});
