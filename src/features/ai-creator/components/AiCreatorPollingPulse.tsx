"use client";

import type { CSSProperties } from "react";

type AiCreatorPollingPulseProps = {
  pulse: number;
  readyCount: number;
  status: string;
  total: number;
};

export function AiCreatorPollingPulse(props: AiCreatorPollingPulseProps) {
  return (
    <div aria-label={pulseLabel(props)} className="ai-creator-polling-pulse" role="status">
      <div className="ai-creator-polling-orbit" style={pulseStyle(props.pulse)}>
        <span />
        <span />
        <span />
      </div>
      <div className="ai-creator-polling-core">
        <strong>{progressCounter(props)}</strong>
      </div>
    </div>
  );
}

function pulseStyle(pulse: number) {
  return { "--poll-angle": `${pulse * 54}deg` } as CSSProperties;
}

function progressCounter(props: AiCreatorPollingPulseProps) {
  return `${props.readyCount}/${props.total}`;
}

function pulseLabel(props: AiCreatorPollingPulseProps) {
  return `${props.status}: ${progressCounter(props)} clips`;
}
