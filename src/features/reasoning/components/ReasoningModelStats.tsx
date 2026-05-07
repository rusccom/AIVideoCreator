import type { EditableReasoningModel } from "../types";

type ReasoningModelStatsProps = {
  model: EditableReasoningModel;
};

export function ReasoningModelStats({ model }: ReasoningModelStatsProps) {
  const stats = model.stats;
  return (
    <div className="settings-grid">
      <Stat label="requests" value={formatNumber(stats.requestCount)} />
      <Stat label="input tokens" value={formatNumber(stats.promptTokens)} />
      <Stat label="output tokens" value={formatNumber(stats.completionTokens)} />
      <Stat label="reasoning tokens" value={formatNumber(stats.reasoningTokens)} />
      <Stat label="total tokens" value={formatNumber(stats.totalTokens)} />
      <Stat label="provider cost" value={formatUsd(stats.estimatedCostUsd)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatUsd(value: number) {
  return `$${value.toFixed(4)}`;
}
