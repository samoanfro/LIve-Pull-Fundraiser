import { redirect } from "next/navigation";
import { getReceiveInventoryFormData } from "./actions";
import { ReceiveInventoryForm } from "./receive-inventory-form";

export default async function ReceiveInventoryPage() {
  const formData = await getReceiveInventoryFormData();

  if (!formData) {
    redirect("/admin");
  }

  if (formData.products.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Receive Inventory
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Create a product first before receiving inventory.
        </p>
      </div>
    );
  }

  if (formData.storageLocations.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Receive Inventory
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Create a storage location first before receiving inventory.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Receive Inventory
      </h1>
      <div className="mt-6">
        <ReceiveInventoryForm
          products={formData.products}
          storageLocations={formData.storageLocations}
          organizationId={formData.organizationId}
        />
      </div>
    </div>
  );
}
