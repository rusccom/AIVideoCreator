type TimelineScaleProps = {
  step: number;
  seconds: number;
  width: number;
};

export function TimelineScale(props: TimelineScaleProps) {
  return (
    <div className="timeline-scale" style={{ width: props.width }}>
      {ticks(props.seconds, props.step).map((tick) => (
        <span key={tick} style={{ left: `${(tick / props.seconds) * 100}%` }}>
          {formatTime(tick)}
        </span>
      ))}
    </div>
  );
}

function ticks(seconds: number, step: number) {
  const count = Math.floor(seconds / step) + 1;
  return Array.from({ length: count }, (_, index) => index * step);
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}m ${rest}s` : `${seconds}s`;
}
