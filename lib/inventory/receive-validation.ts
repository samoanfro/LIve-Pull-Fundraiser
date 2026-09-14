export type Condition = "sealed" | "damaged" | "other";

export interface ReceiveInventoryInput {
  productId: string;
  packId: string;
  storageLocationId: string;
  condition: Condition;
  supplierSource?: string;
  lotCaseReference?: string;
  unitCostDollars?: string;
  notes?: string;
}

const VALID_CONDITIONS: readonly Condition[] = ["sealed", "damaged", "other"];

export function validateReceiveInventoryInput(
  input: Partial<ReceiveInventoryInput>,
): string[] {
  const errors: string[] = [];

  if (!input.productId) {
    errors.push("Product is required.");
  }
  if (!input.packId || input.packId.trim().length === 0) {
    errors.push("Pack ID is required.");
  }
  if (!input.storageLocationId) {
    errors.push("Storage location is required.");
  }
  if (!input.condition || !VALID_CONDITIONS.includes(input.condition)) {
    errors.push("Condition is required.");
  }
  if (input.unitCostDollars) {
    const value = Number(input.unitCostDollars);
    if (!Number.isFinite(value) || value < 0) {
      errors.push("Unit cost must be zero or a positive number.");
    }
  }

  return errors;
}
