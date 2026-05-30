import type { EditableAiModel } from "@/shared/model-form";
import { ModelCheckbox, ModelFieldSection, ModelTextInput } from "@/shared/model-form";
import { AiModelMarginHint } from "./AiModelMarginHint";

type AiModelPricingFieldsProps = {
  creditsPerUsd: number;
  model: EditableAiModel;
};

export function AiModelPricingFields({ creditsPerUsd, model }: AiModelPricingFieldsProps) {
  return (
    <ModelFieldSection title="Pricing">
      <div className="ai-model-edit-grid">
        {model.supportedResolutions.map((resolution) => resolutionPrice(model, resolution, creditsPerUsd))}
        <ModelCheckbox checked={model.active} label="Active for users" name="active" />
      </div>
    </ModelFieldSection>
  );
}

function resolutionPrice(model: EditableAiModel, resolution: string, creditsPerUsd: number) {
  const credits = model.pricePerSecondByResolution[resolution] ?? 0;
  return (
    <div className="model-price-cell" key={resolution}>
      <ModelTextInput label={`${resolution} credits / sec`} min={0} name={priceField(resolution)} type="number" value={`${credits}`} />
      <AiModelMarginHint
        costUsd={model.providerCostPerSecondUsdByResolution?.[resolution]}
        credits={credits}
        creditsPerUsd={creditsPerUsd}
      />
    </div>
  );
}

function priceField(resolution: string) {
  return `pricePerSecond_${resolution}`;
}
