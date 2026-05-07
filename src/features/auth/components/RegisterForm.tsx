"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    finish(response);
  }

  function finish(response: Response) {
    setLoading(false);
    if (response.ok) {
      router.push("/app");
      router.refresh();
      return;
    }
    setError("Account could not be created with these details.");
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {error ? <div className="form-error">{error}</div> : null}
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" minLength={8} type="password" required />
      </div>
      <button className="button button-primary" disabled={loading} type="submit">
        {loading ? "Creating account..." : "Create account"}
      </button>
      <p className="form-note">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
