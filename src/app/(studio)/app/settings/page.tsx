import { ChangePasswordForm } from "@/features/settings/components/ChangePasswordForm";

export default function SettingsPage() {
  return (
    <>
      <div className="studio-page-header">
        <div>
          <h1>Settings</h1>
          <p>Change your account password.</p>
        </div>
      </div>
      <ChangePasswordForm />
    </>
  );
}
