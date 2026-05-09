import { Plus } from "lucide-react";
import type { AiCreatorMediaSlot } from "../types";
import { AiCreatorMediaTile } from "./AiCreatorMediaTile";

type AiCreatorMediaPanelProps = {
  addDisabled?: boolean;
  generating: boolean;
  onAdd: () => void;
  onSelect: (slot: AiCreatorMediaSlot) => void;
  selectedAssetId?: string;
  slots: AiCreatorMediaSlot[];
};

export function AiCreatorMediaPanel(props: AiCreatorMediaPanelProps) {
  return (
    <section className="ai-creator-panel ai-creator-media-panel">
      <div className="ai-creator-panel-header">
        <div>
          <h3>Media</h3>
          <span>{props.generating ? "Generating images..." : `${props.slots.length} slots`}</span>
        </div>
        <button className="button button-secondary" disabled={props.addDisabled} onClick={props.onAdd} type="button">
          <Plus size={15} /> Add
        </button>
      </div>
      <div className="ai-creator-media-grid">
        {props.slots.map((slot) => (
          <AiCreatorMediaTile
            key={slot.id}
            onSelect={props.onSelect}
            selected={Boolean(slot.assetId && slot.assetId === props.selectedAssetId)}
            slot={slot}
          />
        ))}
      </div>
    </section>
  );
}
