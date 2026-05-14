"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form className="auth-form" onSubmit={loginSubmit(router, setError, setLoading)}>
      {error ? <div className="form-error">{error}</div> : null}
      {authField("email", "Email", "email")}
      {authField("password", "Password", "password")}
      <button className="button button-primary" disabled={loading} type="submit">{loading ? "Signing in..." : "Sign in"}</button>
      <p className="form-note">New here? <Link href="/register">Create an account</Link></p>
    </form>
  );
}

function loginSubmit(router: ReturnType<typeof useRouter>, setError: SetText, setLoading: SetLoading) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    finishLogin(router, setError, setLoading, await postForm("/api/auth/login", event.currentTarget));
  };
}

function finishLogin(router: ReturnType<typeof useRouter>, setError: SetText, setLoading: SetLoading, response: Response) {
  setLoading(false);
  if (!response.ok) return setError("Email or password is incorrect.");
  router.push("/app");
  router.refresh();
}

function authField(id: string, label: string, type: string) {
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} name={id} type={type} required /></div>;
}

async function postForm(url: string, form: HTMLFormElement) {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
}

type SetText = (value: string) => void;
type SetLoading = (value: boolean) => void;
