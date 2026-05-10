import type { ClipBox } from "../playback/timeline-layout";
import { TimelineClipCard } from "./TimelineClipCard";

type TimelineTrackProps = {
  clipBoxes: readonly ClipBox[];
  onSelect: (sceneId: string) => void;
  selectedSceneId?: string;
  width: number;
};

export function TimelineTrack(props: TimelineTrackProps) {
  return (
    <div className="timeline-track" style={{ width: props.width }}>
      {props.clipBoxes.length === 0 ? <p className="timeline-empty">No clips in this timeline yet.</p> : null}
      {props.clipBoxes.map((box) => (
        <div className="timeline-clip-slot" key={box.scene.id} style={{ left: box.left, width: box.width }}>
          <TimelineClipCard
            onSelect={props.onSelect}
            scene={box.scene}
            selected={box.scene.id === props.selectedSceneId}
          />
        </div>
      ))}
    </div>
  );
}
