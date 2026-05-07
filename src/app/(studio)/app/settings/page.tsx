export default function SettingsPage() {
  return (
    <>
      <div className="studio-page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure account, prompt language, notifications, and workspace defaults.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="settings-panel">
          <h2>Workspace</h2>
          <p className="section-copy">Default format: 16:9 cinematic</p>
        </section>
        <section className="settings-panel">
          <h2>Security</h2>
          <p className="section-copy">Password reset and email verification hooks are ready.</p>
        </section>
      </div>
    </>
  );
}
