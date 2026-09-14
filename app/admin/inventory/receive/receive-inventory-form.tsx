"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  generatePackIdAction,
  receiveInventoryUnitAction,
} from "./actions";
import type { Condition } from "@/lib/inventory/receive-validation";

interface Product {
  id: string;
  name: string;
}

interface StorageLocation {
  id: string;
  name: string;
}

interface FormValues {
  productId: string;
  packId: string;
  supplierSource: string;
  lotCaseReference: string;
  storageLocationId: string;
  condition: Condition;
  unitCostDollars: string;
  notes: string;
}

const emptyForm: FormValues = {
  productId: "",
  packId: "",
  supplierSource: "",
  lotCaseReference: "",
  storageLocationId: "",
  condition: "sealed",
  unitCostDollars: "",
  notes: "",
};

export function ReceiveInventoryForm({
  products,
  storageLocations,
  organizationId,
}: {
  products: Product[];
  storageLocations: StorageLocation[];
  organizationId: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(0);

  const update = useCallback(
    <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  async function handleGeneratePackId() {
    const result = await generatePackIdAction();
    if (result.error) {
      setError(result.error);
      return;
    }
    update("packId", result.packId ?? "");
  }

  async function uploadPhotoIfPresent(): Promise<string | null> {
    if (!photoFile) return null;
    const supabase = createClient();
    const path = `${organizationId}/${crypto.randomUUID()}-${photoFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("inventory-photos")
      .upload(path, photoFile);

    if (uploadError) {
      // Photo failure must not block or duplicate the core inventory record.
      setError(
        `Saved without photo — upload failed: ${uploadError.message}`,
      );
      return null;
    }
    return path;
  }

  async function submit(mode: "addNext" | "finish", event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    const photoPath = await uploadPhotoIfPresent();

    const result = await receiveInventoryUnitAction({
      productId: values.productId,
      packId: values.packId,
      storageLocationId: values.storageLocationId,
      condition: values.condition,
      supplierSource: values.supplierSource,
      lotCaseReference: values.lotCaseReference,
      unitCostDollars: values.unitCostDollars,
      notes: values.notes,
      photoPath,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSavedCount((count) => count + 1);
    setPhotoFile(null);

    if (mode === "finish") {
      router.push("/admin/inventory");
      return;
    }

    // Save & Add Next: keep Product, Supplier, Lot/Case, Storage Location;
    // always clear Pack ID.
    setValues((prev) => ({ ...prev, packId: "", notes: "" }));
  }

  return (
    <form className="flex max-w-md flex-col gap-4">
      {savedCount > 0 && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          {savedCount} pack{savedCount === 1 ? "" : "s"} received this
          session.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Product *
        <select
          required
          value={values.productId}
          onChange={(e) => update("productId", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-3 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Select product
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Pack ID *
        <div className="flex gap-2">
          <input
            required
            value={values.packId}
            onChange={(e) => update("packId", e.target.value)}
            placeholder="PACK-000001"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-3 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="button"
            onClick={handleGeneratePackId}
            className="shrink-0 rounded-md border border-zinc-300 px-3 py-3 text-sm font-medium dark:border-zinc-700"
          >
            Generate
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Supplier / Source
        <input
          value={values.supplierSource}
          onChange={(e) => update("supplierSource", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-3 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Lot / Case / Box Reference
        <input
          value={values.lotCaseReference}
          onChange={(e) => update("lotCaseReference", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-3 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Storage Location *
        <select
          required
          value={values.storageLocationId}
          onChange={(e) => update("storageLocationId", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-3 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Select storage location
          </option>
          {storageLocations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Condition *
        <select
          required
          value={values.condition}
          onChange={(e) => update("condition", e.target.value as Condition)}
          className="rounded-md border border-zinc-300 px-3 py-3 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="sealed">Sealed</option>
          <option value="damaged">Damaged</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Unit Cost (USD)
        <input
          type="number"
          min="0"
          step="0.01"
          value={values.unitCostDollars}
          onChange={(e) => update("unitCostDollars", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-3 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Photo
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          className="text-base font-normal"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Notes
        <textarea
          rows={2}
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-3 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={submitting}
          onClick={(e) => submit("addNext", e)}
          className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {submitting ? "Saving..." : "Save & Add Next"}
        </button>
        <button
          type="submit"
          disabled={submitting}
          onClick={(e) => submit("finish", e)}
          className="w-full rounded-md border border-zinc-300 px-4 py-3 text-base font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          {submitting ? "Saving..." : "Save & Finish"}
        </button>
      </div>
    </form>
  );
}
