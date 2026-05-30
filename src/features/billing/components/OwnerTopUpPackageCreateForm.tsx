import { ModelCheckbox, ModelTextInput } from "@/shared/model-form";

type OwnerTopUpPackageCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function OwnerTopUpPackageCreateForm({ action }: OwnerTopUpPackageCreateFormProps) {
  return (
    <form action={action} className="settings-panel model-form">
      <div className="ai-model-card-header">
        <div>
          <h2>New package</h2>
          <p>Add a credit top-up offered at checkout.</p>
        </div>
      </div>
      <div className="ai-model-edit-grid">
        <ModelTextInput label="Key" name="key" type="text" value="" />
        <ModelTextInput label="Label" name="label" type="text" value="" />
        <ModelTextInput label="Amount, $" min={0} name="amountUsd" type="number" value="" />
        <ModelTextInput label="Bonus credits" min={0} name="bonusCredits" type="number" value="0" />
        <ModelTextInput label="Sort order" min={0} name="sortOrder" type="number" value="0" />
        <ModelCheckbox checked={false} label="Popular" name="popular" />
        <ModelCheckbox checked label="Active" name="active" />
      </div>
      <div className="ai-model-actions">
        <button className="button button-secondary" type="submit">Add package</button>
      </div>
    </form>
  );
}
