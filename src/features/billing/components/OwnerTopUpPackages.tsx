import { OwnerTopUpPackageCreateForm } from "./OwnerTopUpPackageCreateForm";
import { OwnerTopUpPackageRow, type OwnerTopUpPackage } from "./OwnerTopUpPackageRow";

type OwnerTopUpPackagesProps = {
  createAction: (formData: FormData) => void | Promise<void>;
  creditsPerUsd: number;
  deleteAction: (formData: FormData) => void | Promise<void>;
  packages: OwnerTopUpPackage[];
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function OwnerTopUpPackages(props: OwnerTopUpPackagesProps) {
  return (
    <div className="side-stack">
      <div className="studio-page-header">
        <div>
          <h2>Top-up packages</h2>
          <p>Credits are amount × rate + bonus. Keys are stored on payments — avoid renaming.</p>
        </div>
      </div>
      {props.packages.map((pkg) => (
        <OwnerTopUpPackageRow
          creditsPerUsd={props.creditsPerUsd}
          deleteAction={props.deleteAction}
          key={pkg.id}
          pkg={pkg}
          updateAction={props.updateAction}
        />
      ))}
      <OwnerTopUpPackageCreateForm action={props.createAction} />
    </div>
  );
}
