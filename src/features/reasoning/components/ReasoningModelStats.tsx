import type { EditableReasoningModel } from "../types";
import { ReasoningStat } from "./ReasoningStat";

type ReasoningModelStatsProps = {
  model: EditableReasoningModel;
};

export function ReasoningModelStats({ model }: ReasoningModelStatsProps) {
  const stats = model.stats;
  return (
    <div className="settings-grid">
      <ReasoningStat label="requests" value={formatNumber(stats.requestCount)} />
      <ReasoningStat label="input tokens" value={formatNumber(stats.promptTokens)} />
      <ReasoningStat label="output tokens" value={formatNumber(stats.completionTokens)} />
      <ReasoningStat label="reasoning tokens" value={formatNumber(stats.reasoningTokens)} />
      <ReasoningStat label="total tokens" value={formatNumber(stats.totalTokens)} />
      <ReasoningStat label="provider cost" value={formatUsd(stats.estimatedCostUsd)} />
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatUsd(value: number) {
  return `$${value.toFixed(4)}`;
}
