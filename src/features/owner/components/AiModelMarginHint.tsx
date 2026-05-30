type AiModelMarginHintProps = {
  costUsd?: number;
  credits: number;
  creditsPerUsd: number;
};

export function AiModelMarginHint({ costUsd, credits, creditsPerUsd }: AiModelMarginHintProps) {
  const saleUsd = creditsPerUsd > 0 ? credits / creditsPerUsd : 0;
  return <small className="model-margin-hint">{hintText(saleUsd, costUsd)}</small>;
}

function hintText(saleUsd: number, costUsd?: number) {
  const sale = `$${saleUsd.toFixed(3)}/s`;
  if (costUsd === undefined) return `${sale} · cost n/a`;
  return `${sale} · cost $${costUsd.toFixed(3)} · margin ${marginPercent(saleUsd, costUsd)}%`;
}

function marginPercent(saleUsd: number, costUsd: number) {
  if (saleUsd <= 0) return 0;
  return Math.round(((saleUsd - costUsd) / saleUsd) * 100);
}
