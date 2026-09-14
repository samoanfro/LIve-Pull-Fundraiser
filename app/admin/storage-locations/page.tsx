import { getCurrentOrgContext } from "@/lib/auth/current-org";
import { StorageLocationForm } from "./storage-location-form";

export default async function StorageLocationsPage() {
  const context = await getCurrentOrgContext();
  if (!context) return null;

  const { data: locations } = await context.supabase
    .from("storage_locations")
    .select("id, name, type")
    .order("name");

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Storage Locations
      </h1>

      <div className="mt-6">
        <StorageLocationForm />
      </div>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {locations?.map((location) => (
          <li key={location.id} className="py-3">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {location.name}
            </p>
            <p className="text-sm text-zinc-500">{location.type}</p>
          </li>
        ))}
        {locations?.length === 0 && (
          <li className="py-3 text-sm text-zinc-500">
            No storage locations yet.
          </li>
        )}
      </ul>
    </div>
  );
}
