export type TimelineScale = {
  label: string;
  tickSeconds: number;
  visibleSeconds: number;
};

export const timelineScales: readonly TimelineScale[] = [
  { label: "30s", tickSeconds: 5, visibleSeconds: 30 },
  { label: "1m", tickSeconds: 10, visibleSeconds: 60 },
  { label: "5m", tickSeconds: 60, visibleSeconds: 300 },
  { label: "10m", tickSeconds: 120, visibleSeconds: 600 },
  { label: "1h", tickSeconds: 600, visibleSeconds: 3600 }
];

export function clampScaleIndex(index: number) {
  return Math.max(0, Math.min(timelineScales.length - 1, index));
}
