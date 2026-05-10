type TimelinePlayheadProps = {
  position: number;
};

export function TimelinePlayhead({ position }: TimelinePlayheadProps) {
  return <div className="timeline-playhead" style={{ left: position }} aria-hidden="true" />;
}
