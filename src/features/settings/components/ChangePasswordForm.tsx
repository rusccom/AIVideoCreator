"use client";

import { FormEvent, useState } from "react";
import styles from "./ChangePasswordForm.module.css";

export function ChangePasswordForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setSuccess("");
    if (!passwordsMatch(form)) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    const response = await savePassword(form);
    finish(form, response);
  }

  function finish(form: HTMLFormElement, response: Response) {
    setLoading(false);
    if (!response.ok) {
      setError("Current password or new password is incorrect.");
      return;
    }
    form.reset();
    setSuccess("Password updated.");
  }

  return (
    <section className={`settings-panel ${styles.panel}`}>
      <h2>Password</h2>
      <form className={styles.form} onSubmit={submit}>
        {error ? <div className="form-error">{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}
        <div className="field">
          <label htmlFor="currentPassword">Current password</label>
          <input
            autoComplete="current-password"
            id="currentPassword"
            maxLength={200}
            minLength={8}
            name="currentPassword"
            type="password"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <input
            autoComplete="new-password"
            id="newPassword"
            maxLength={200}
            minLength={8}
            name="newPassword"
            type="password"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            autoComplete="new-password"
            id="confirmPassword"
            maxLength={200}
            minLength={8}
            name="confirmPassword"
            type="password"
            required
          />
        </div>
        <button className="button button-primary" disabled={loading} type="submit">
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </section>
  );
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
