"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form className="auth-form" onSubmit={registerSubmit(router, setError, setLoading)}>
      {error ? <div className="form-error">{error}</div> : null}
      {registerField("name", "Name")}
      {registerField("email", "Email", "email")}
      {registerField("password", "Password", "password", 8)}
      <button className="button button-primary" disabled={loading} type="submit">{loading ? "Creating account..." : "Create account"}</button>
      <p className="form-note">Already have an account? <Link href="/login">Sign in</Link></p>
    </form>
  );
}

function registerSubmit(router: ReturnType<typeof useRouter>, setError: SetText, setLoading: SetLoading) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    finishRegister(router, setError, setLoading, await postForm("/api/auth/register", event.currentTarget));
  };
}

function finishRegister(router: ReturnType<typeof useRouter>, setError: SetText, setLoading: SetLoading, response: Response) {
  setLoading(false);
  if (!response.ok) return setError("Account could not be created with these details.");
  router.push("/app");
  router.refresh();
}

function registerField(id: string, label: string, type = "text", minLength?: number) {
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} minLength={minLength} name={id} type={type} required /></div>;
}

async function postForm(url: string, form: HTMLFormElement) {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
}

type SetText = (value: string) => void;
type SetLoading = (value: boolean) => void;
