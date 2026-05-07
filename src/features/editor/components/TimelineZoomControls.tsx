type TimelineZoomControlsProps = {
  rangeLabel: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function TimelineZoomControls(props: TimelineZoomControlsProps) {
  return (
    <div className="timeline-zoom-controls">
      <button className="button button-quiet" onClick={props.onZoomOut} type="button">-</button>
      <span className="badge">{props.rangeLabel}</span>
      <button className="button button-quiet" onClick={props.onZoomIn} type="button">+</button>
    </div>
  );
}
