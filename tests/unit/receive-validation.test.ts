import { describe, expect, it } from "vitest";
import { validateReceiveInventoryInput } from "@/lib/inventory/receive-validation";

const validInput = {
  productId: "prod-1",
  packId: "PACK-000001",
  storageLocationId: "loc-1",
  condition: "sealed" as const,
};

describe("validateReceiveInventoryInput", () => {
  it("passes with no errors for valid input", () => {
    expect(validateReceiveInventoryInput(validInput)).toEqual([]);
  });

  it("requires productId", () => {
    const errors = validateReceiveInventoryInput({
      ...validInput,
      productId: "",
    });
    expect(errors).toContain("Product is required.");
  });

  it("requires a non-blank packId", () => {
    expect(
      validateReceiveInventoryInput({ ...validInput, packId: "" }),
    ).toContain("Pack ID is required.");
    expect(
      validateReceiveInventoryInput({ ...validInput, packId: "   " }),
    ).toContain("Pack ID is required.");
  });

  it("requires storageLocationId", () => {
    const errors = validateReceiveInventoryInput({
      ...validInput,
      storageLocationId: "",
    });
    expect(errors).toContain("Storage location is required.");
  });

  it("rejects an invalid condition", () => {
    const errors = validateReceiveInventoryInput({
      ...validInput,
      // @ts-expect-error intentionally invalid for the test
      condition: "mint",
    });
    expect(errors).toContain("Condition is required.");
  });

  it("rejects a negative unit cost", () => {
    const errors = validateReceiveInventoryInput({
      ...validInput,
      unitCostDollars: "-5",
    });
    expect(errors).toContain("Unit cost must be zero or a positive number.");
  });

  it("accepts a zero unit cost", () => {
    const errors = validateReceiveInventoryInput({
      ...validInput,
      unitCostDollars: "0",
    });
    expect(errors).toEqual([]);
  });
});
