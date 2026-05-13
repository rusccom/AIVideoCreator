"use client";

import type { CSSProperties } from "react";

type AiCreatorProgressPulseProps = {
  pulse: number;
  readyCount: number;
  status: string;
  total: number;
};

export function AiCreatorProgressPulse(props: AiCreatorProgressPulseProps) {
  return (
    <div aria-label={pulseLabel(props)} className="ai-creator-progress-pulse" role="status">
      <div className="ai-creator-progress-orbit" style={pulseStyle(props.pulse)}>
        <span />
        <span />
        <span />
      </div>
      <div className="ai-creator-progress-core">
        <strong>{progressCounter(props)}</strong>
      </div>
    </div>
  );
}

function pulseStyle(pulse: number) {
  return { "--progress-angle": `${pulse * 54}deg` } as CSSProperties;
}

function progressCounter(props: AiCreatorProgressPulseProps) {
  return `${props.readyCount}/${props.total}`;
}

function pulseLabel(props: AiCreatorProgressPulseProps) {
  return `${props.status}: ${progressCounter(props)} clips`;
}
