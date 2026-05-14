"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function OwnerLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form className="auth-form" onSubmit={ownerLoginSubmit(router, setError, setLoading)}>
      {error ? <div className="form-error">{error}</div> : null}
      {ownerField("email", "Email", "email")}
      {ownerField("password", "Password", "password")}
      <button className="button button-primary" disabled={loading} type="submit">{loading ? "Checking..." : "Enter owner panel"}</button>
    </form>
  );
}

function ownerLoginSubmit(router: ReturnType<typeof useRouter>, setError: SetText, setLoading: SetLoading) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    finishOwnerLogin(router, setError, setLoading, await postForm("/api/owner/login", event.currentTarget));
  };
}

function finishOwnerLogin(router: ReturnType<typeof useRouter>, setError: SetText, setLoading: SetLoading, response: Response) {
  setLoading(false);
  if (!response.ok) return setError("Owner credentials are required.");
  router.push("/owner/models");
  router.refresh();
}

function ownerField(id: string, label: string, type: string) {
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} name={id} type={type} required /></div>;
}

async function postForm(url: string, form: HTMLFormElement) {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
}

type SetText = (value: string) => void;
type SetLoading = (value: boolean) => void;
