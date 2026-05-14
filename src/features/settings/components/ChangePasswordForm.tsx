"use client";

import { useState, type FormEvent } from "react";
import styles from "./ChangePasswordForm.module.css";

export function ChangePasswordForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  return (
    <section className={`settings-panel ${styles.panel}`}>
      <h2>Password</h2>
      <form className={styles.form} onSubmit={passwordSubmit(setError, setSuccess, setLoading)}>
        {error ? <div className="form-error">{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}
        {passwordField("currentPassword", "Current password", "current-password")}
        {passwordField("newPassword", "New password", "new-password")}
        {passwordField("confirmPassword", "Confirm new password", "new-password")}
        <button className="button button-primary" disabled={loading} type="submit">{loading ? "Updating..." : "Update password"}</button>
      </form>
    </section>
  );
}

function passwordSubmit(setError: SetText, setSuccess: SetText, setLoading: SetLoading) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setSuccess("");
    if (!passwordsMatch(form)) return setError("New passwords do not match.");
    setLoading(true);
    finishPassword(form, await savePassword(form), setError, setSuccess, setLoading);
  };
}

function finishPassword(form: HTMLFormElement, response: Response, setError: SetText, setSuccess: SetText, setLoading: SetLoading) {
  setLoading(false);
  if (!response.ok) return setError("Current password or new password is incorrect.");
  form.reset();
  setSuccess("Password updated.");
}

function passwordField(id: string, label: string, autoComplete: string) {
  return <div className="field"><label htmlFor={id}>{label}</label><input autoComplete={autoComplete} id={id} maxLength={200} minLength={8} name={id} type="password" required /></div>;
}

async function savePassword(form: HTMLFormElement) {
  return fetch("/api/auth/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(form)))
  });
}

function passwordsMatch(form: HTMLFormElement) {
  const data = new FormData(form);
  return data.get("newPassword") === data.get("confirmPassword");
}

type SetText = (value: string) => void;
type SetLoading = (value: boolean) => void;
