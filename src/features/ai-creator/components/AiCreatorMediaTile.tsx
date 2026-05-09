import { Check } from "lucide-react";
import type { AiCreatorMediaSlot } from "../types";
import { AiCreatorSpinner } from "./AiCreatorSpinner";

type AiCreatorMediaTileProps = {
  onSelect: (slot: AiCreatorMediaSlot) => void;
  selected: boolean;
  slot: AiCreatorMediaSlot;
};

export function AiCreatorMediaTile(props: AiCreatorMediaTileProps) {
  return (
    <button
      aria-pressed={props.selected}
      className={tileClass(props.slot, props.selected)}
      disabled={props.slot.status !== "ready"}
      onClick={() => props.onSelect(props.slot)}
      type="button"
    >
      {props.slot.url ? <img alt={props.slot.label} src={props.slot.url} /> : <AiCreatorSpinner />}
      {props.selected ? <span className="ai-creator-media-check"><Check size={15} /></span> : null}
      {props.slot.status === "failed" ? <span className="ai-creator-media-error">Failed</span> : null}
    </button>
  );
}

function tileClass(slot: AiCreatorMediaSlot, selected: boolean) {
  const classes = ["ai-creator-media-tile", slot.status];
  if (selected) classes.push("selected");
  return classes.join(" ");
}
