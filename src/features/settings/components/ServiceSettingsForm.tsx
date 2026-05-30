import type { ServiceSettings } from "@/shared/server/service-settings";

type ServiceSettingsFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  settings: ServiceSettings;
};

export function ServiceSettingsForm({ action, settings }: ServiceSettingsFormProps) {
  return (
    <form action={action} className="settings-panel model-form">
      <h2>Credit economy</h2>
      <p className="form-note">Credits per $1 sets the exchange rate. Welcome credits are granted on registration.</p>
      <div className="ai-model-edit-grid">
        {settingField("Credits per $1", "creditsPerUsd", settings.creditsPerUsd, 1)}
        {settingField("Welcome credits", "welcomeCredits", settings.welcomeCredits, 0)}
      </div>
      <div className="ai-model-actions">
        <button className="button button-secondary" type="submit">Save settings</button>
      </div>
    </form>
  );
}

function settingField(label: string, name: string, value: number, min: number) {
  return (
    <label className="model-input">
      <span>{label}</span>
      <input defaultValue={value} min={min} name={name} type="number" />
    </label>
  );
}
