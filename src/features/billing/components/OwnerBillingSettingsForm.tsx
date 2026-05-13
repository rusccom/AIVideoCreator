import { updateBillingSettingsAction } from "../server/billing-owner-actions";

type OwnerBillingSettingsFormProps = {
  creditsPerUsd: number;
};

export function OwnerBillingSettingsForm({
  creditsPerUsd
}: OwnerBillingSettingsFormProps) {
  return (
    <form action={updateBillingSettingsAction} className="billing-owner-form">
      <label className="field">
        <span>Credits per $1</span>
        <input
          defaultValue={creditsPerUsd}
          min={1}
          name="creditsPerUsd"
          step={1}
          type="number"
        />
      </label>
      <button className="button button-secondary" type="submit">
        Save rate
      </button>
    </form>
  );
}
