import type { PhotoLibraryAsset } from "../types";

type PhotoReferenceFieldProps = {
  assets: PhotoLibraryAsset[];
  disabled: boolean;
  onChange: (value: string) => void;
  value: string;
};

export function PhotoReferenceField(props: PhotoReferenceFieldProps) {
  if (props.assets.length === 0) return null;
  return (
    <label className="photo-library-field">
      Reference photo
      <select disabled={props.disabled} onChange={(event) => props.onChange(event.target.value)} value={props.value}>
        <option value="">No reference</option>
        {props.assets.map((asset, index) => <option key={asset.id} value={asset.id}>{assetLabel(asset, index)}</option>)}
      </select>
    </label>
  );
}

function assetLabel(asset: PhotoLibraryAsset, index: number) {
  return `${index + 1}. ${asset.label}`;
}
