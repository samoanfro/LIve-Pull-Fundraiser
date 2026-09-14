"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitShippingAddressAction,
  confirmDonationBackAction,
  type ShippingAddress,
} from "./actions";

export interface ShippingRequestInfo {
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  addressJson: ShippingAddress | null;
}

export interface DonationBackInfo {
  confirmedAt: string;
  dispositionStatus: string | null;
}

const emptyAddress: ShippingAddress = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

export function ShipDonateChoice({
  token,
  orderId,
  shippingRequest,
  donationBack,
}: {
  token: string;
  orderId: string;
  shippingRequest: ShippingRequestInfo | null;
  donationBack: DonationBackInfo | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "ship" | "donate">("choose");
  const [address, setAddress] = useState<ShippingAddress>(
    shippingRequest?.addressJson ?? emptyAddress,
  );
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Donation already confirmed -- final, read-only summary.
  if (donationBack) {
    return (
      <div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          You chose to donate these items back. Thank you!
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Confirmed {new Date(donationBack.confirmedAt).toLocaleDateString()}
        </p>
        {donationBack.dispositionStatus ? (
          <p className="mt-1 text-sm text-zinc-500">
            Status: {donationBack.dispositionStatus.replaceAll("_", " ")}
          </p>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">
            Awaiting disposition update from our team.
          </p>
        )}
      </div>
    );
  }

  // Shipping already requested -- show address form (editable while early)
  // or read-only tracking info (once fulfillment has started).
  if (shippingRequest) {
    const editable =
      shippingRequest.status === "REQUESTED" ||
      shippingRequest.status === "ADDRESS_CONFIRMED";

    if (!editable) {
      return (
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Shipping status: {shippingRequest.status.replaceAll("_", " ")}
          </p>
          {shippingRequest.carrier && (
            <p className="mt-1 text-sm text-zinc-500">
              {shippingRequest.carrier} {shippingRequest.trackingNumber}
            </p>
          )}
        </div>
      );
    }

    return (
      <AddressForm
        address={address}
        setAddress={setAddress}
        error={error}
        pending={pending}
        onSubmit={() => {
          setError("");
          startTransition(async () => {
            const result = await submitShippingAddressAction(
              token,
              orderId,
              address,
            );
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      />
    );
  }

  // No decision recorded yet.
  if (mode === "ship") {
    return (
      <AddressForm
        address={address}
        setAddress={setAddress}
        error={error}
        pending={pending}
        onBack={() => setMode("choose")}
        onSubmit={() => {
          setError("");
          startTransition(async () => {
            const result = await submitShippingAddressAction(
              token,
              orderId,
              address,
            );
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      />
    );
  }

  if (mode === "donate") {
    return (
      <div>
        <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          I agree to donate the items shown above back to the nonprofit and
          understand this does not automatically imply a specific tax
          deduction or fair-market value.
        </label>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("choose")}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!agreed || pending}
            onClick={() => {
              setError("");
              startTransition(async () => {
                const result = await confirmDonationBackAction(
                  token,
                  orderId,
                );
                if (result.error) {
                  setError(result.error);
                  return;
                }
                router.refresh();
              });
            }}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {pending ? "Confirming..." : "Confirm Donation"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This decision applies to the physical items shown above.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setMode("ship")}
          className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          Ship My Items
        </button>
        <button
          type="button"
          onClick={() => setMode("donate")}
          className="w-full rounded-md border border-zinc-300 px-4 py-3 text-base font-medium dark:border-zinc-700"
        >
          Donate Back
        </button>
      </div>
    </div>
  );
}

function AddressForm({
  address,
  setAddress,
  error,
  pending,
  onSubmit,
  onBack,
}: {
  address: ShippingAddress;
  setAddress: (address: ShippingAddress) => void;
  error: string;
  pending: boolean;
  onSubmit: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <input
        placeholder="Full name"
        value={address.name}
        onChange={(e) => setAddress({ ...address, name: e.target.value })}
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <input
        placeholder="Address line 1"
        value={address.line1}
        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <input
        placeholder="Address line 2 (optional)"
        value={address.line2}
        onChange={(e) => setAddress({ ...address, line2: e.target.value })}
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex gap-2">
        <input
          placeholder="City"
          value={address.city}
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
          className="w-1/2 rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="State"
          value={address.state}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
          className="w-1/4 rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="ZIP"
          value={address.postalCode}
          onChange={(e) =>
            setAddress({ ...address, postalCode: e.target.value })
          }
          className="w-1/4 rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <input
        placeholder="Country"
        value={address.country}
        onChange={(e) => setAddress({ ...address, country: e.target.value })}
        className="rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          className="flex-1 rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "Saving..." : "Confirm Shipping Address"}
        </button>
      </div>
    </div>
  );
}
