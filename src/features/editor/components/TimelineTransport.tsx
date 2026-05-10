import { Pause, Play } from "lucide-react";

type TimelineTransportProps = {
  currentTime: number;
  isPlaying: boolean;
  onToggle: () => void;
  totalDuration: number;
};

export function TimelineTransport(props: TimelineTransportProps) {
  const Icon = props.isPlaying ? Pause : Play;
  return (
    <div className="timeline-transport">
      <button className="button button-quiet" onClick={props.onToggle} type="button" aria-label={props.isPlaying ? "Pause" : "Play"}>
        <Icon size={16} />
      </button>
      <span className="timeline-time">
        {formatTime(props.currentTime)} / {formatTime(props.totalDuration)}
      </span>
    </div>
  );
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60);
  return `${pad(minutes)}:${pad(rest)}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}
