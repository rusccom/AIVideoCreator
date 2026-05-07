"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function OwnerLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/owner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    finish(response);
  }

  function finish(response: Response) {
    setLoading(false);
    if (response.ok) {
      router.push("/owner/models");
      router.refresh();
      return;
    }
    setError("Owner credentials are required.");
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {error ? <div className="form-error">{error}</div> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      <button className="button button-primary" disabled={loading} type="submit">
        {loading ? "Checking..." : "Enter owner panel"}
      </button>
    </form>
  );
}
