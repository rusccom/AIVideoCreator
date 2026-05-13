"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import type { BillingTopUpOption } from "../server/billing-payment-service";

type TopUpCardProps = {
  option: BillingTopUpOption;
};

export function TopUpCard({ option }: TopUpCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setBusy(true);
    setError("");
    try {
      const response = await checkoutRequest(option.key);
      if (!response.url) throw new Error("Checkout URL is missing");
      window.location.href = response.url;
    } catch {
      setError("Checkout failed");
      setBusy(false);
    }
  }

  return (
    <article className="billing-top-up-card">
      <span>{option.label}</span>
      <strong>{option.credits.toLocaleString()} credits</strong>
      <button className="button button-secondary" disabled={busy} onClick={handleCheckout}>
        <CreditCard size={16} />
        {busy ? "Opening" : "Pay"}
      </button>
      {error ? <small>{error}</small> : null}
    </article>
  );
}

async function checkoutRequest(packageKey: string) {
  const response = await fetch("/api/billing/checkout", requestOptions(packageKey));
  if (!response.ok) throw new Error("Checkout request failed");
  return response.json() as Promise<{ url?: string }>;
}

function requestOptions(packageKey: string) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageKey })
  };
}
