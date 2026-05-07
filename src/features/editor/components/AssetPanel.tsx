import type { EditorAsset } from "../types";
import { ResolvedAssetImage } from "./ResolvedAssetImage";

type AssetPanelProps = {
  assets: EditorAsset[];
};

export function AssetPanel({ assets }: AssetPanelProps) {
  return (
    <section className="editor-panel">
      <div className="editor-panel-header">
        <h2>Assets</h2>
        <span className="badge">Private R2</span>
      </div>
      <div className="asset-tabs">
        <button type="button">Scenes</button>
        <button type="button">Assets</button>
        <button type="button">Refs</button>
      </div>
      <div className="asset-list">
        {assets.length === 0 ? <p className="form-note">No assets yet.</p> : null}
        {assets.map((asset) => (
          <article className="asset-card" key={asset.id}>
            <ResolvedAssetImage alt={asset.label} className="asset-thumb" source={asset.url} />
            <strong>{asset.label}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
