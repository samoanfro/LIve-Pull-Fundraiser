"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitShippingAddressAction,
  confirmDonationBackAction,
  type ShippingAddress,
} from "./actions";
import { btnPrimary, btnSecondary, input } from "@/lib/ui";

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
        <p className="text-sm font-medium text-foreground">
          You chose to donate these items back. Thank you!
        </p>
        <p className="mt-1 text-sm text-muted">
          Confirmed {new Date(donationBack.confirmedAt).toLocaleDateString()}
        </p>
        {donationBack.dispositionStatus ? (
          <p className="mt-1 text-sm text-muted">
            Status: {donationBack.dispositionStatus.replaceAll("_", " ")}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
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
          <p className="text-sm font-medium text-foreground">
            Shipping status: {shippingRequest.status.replaceAll("_", " ")}
          </p>
          {shippingRequest.carrier && (
            <p className="mt-1 text-sm text-muted">
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
        <label className="flex items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 accent-accent"
          />
          I agree to donate the items shown above back to the nonprofit and
          understand this does not automatically imply a specific tax
          deduction or fair-market value.
        </label>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("choose")}
            className={`${btnSecondary} px-4 py-2 text-sm`}
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
            className={`${btnPrimary} px-4 py-2 text-sm`}
          >
            {pending ? "Confirming..." : "Confirm Donation"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted">
        This decision applies to the physical items shown above.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setMode("ship")}
          className={`${btnPrimary} w-full`}
        >
          Ship My Items
        </button>
        <button
          type="button"
          onClick={() => setMode("donate")}
          className={`${btnSecondary} w-full`}
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
        className={input}
      />
      <input
        placeholder="Address line 1"
        value={address.line1}
        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
        className={input}
      />
      <input
        placeholder="Address line 2 (optional)"
        value={address.line2}
        onChange={(e) => setAddress({ ...address, line2: e.target.value })}
        className={input}
      />
      <div className="flex gap-2">
        <input
          placeholder="City"
          value={address.city}
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
          className={`${input} w-1/2`}
        />
        <input
          placeholder="State"
          value={address.state}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
          className={`${input} w-1/4`}
        />
        <input
          placeholder="ZIP"
          value={address.postalCode}
          onChange={(e) =>
            setAddress({ ...address, postalCode: e.target.value })
          }
          className={`${input} w-1/4`}
        />
      </div>
      <input
        placeholder="Country"
        value={address.country}
        onChange={(e) => setAddress({ ...address, country: e.target.value })}
        className={input}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`${btnSecondary} px-4 py-2 text-sm`}
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          className={`${btnPrimary} flex-1`}
        >
          {pending ? "Saving..." : "Confirm Shipping Address"}
        </button>
      </div>
    </div>
  );
}
