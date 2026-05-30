import { ModelCheckbox, ModelTextInput } from "@/shared/model-form";

export type OwnerTopUpPackage = {
  id: string;
  key: string;
  label: string;
  amountCents: number;
  bonusCredits: number;
  popular: boolean;
  active: boolean;
  sortOrder: number;
};

type OwnerTopUpPackageRowProps = {
  creditsPerUsd: number;
  deleteAction: (formData: FormData) => void | Promise<void>;
  pkg: OwnerTopUpPackage;
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function OwnerTopUpPackageRow(props: OwnerTopUpPackageRowProps) {
  const { creditsPerUsd, deleteAction, pkg, updateAction } = props;
  const credits = Math.round((pkg.amountCents * creditsPerUsd) / 100) + pkg.bonusCredits;
  return (
    <form action={updateAction} className="settings-panel model-form">
      <input name="id" type="hidden" value={pkg.id} />
      <input name="key" type="hidden" value={pkg.key} />
      {rowHeader(pkg, credits)}
      <div className="ai-model-edit-grid">
        <ModelTextInput label="Label" name="label" type="text" value={pkg.label} />
        <ModelTextInput label="Amount, $" min={0} name="amountUsd" type="number" value={`${pkg.amountCents / 100}`} />
        <ModelTextInput label="Bonus credits" min={0} name="bonusCredits" type="number" value={`${pkg.bonusCredits}`} />
        <ModelTextInput label="Sort order" min={0} name="sortOrder" type="number" value={`${pkg.sortOrder}`} />
        <ModelCheckbox checked={pkg.popular} label="Popular" name="popular" />
        <ModelCheckbox checked={pkg.active} label="Active" name="active" />
      </div>
      <div className="ai-model-actions">
        <button className="button button-secondary" type="submit">Save</button>
        <button className="button button-danger" formAction={deleteAction} type="submit">Delete</button>
      </div>
    </form>
  );
}

function rowHeader(pkg: OwnerTopUpPackage, credits: number) {
  return (
    <div className="ai-model-card-header">
      <div>
        <h2>{pkg.label}</h2>
        <p>{pkg.key} · {credits.toLocaleString()} credits</p>
      </div>
      <span className="badge">{pkg.active ? "active" : "disabled"}</span>
    </div>
  );
}
