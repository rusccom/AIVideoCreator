import type { EditableAiModel } from "../types";
import { ModelCheckbox } from "./ModelCheckbox";
import { ModelFieldSection } from "./ModelFieldSection";
import { ModelTextInput } from "./ModelTextInput";

type AiModelPricingFieldsProps = {
  model: EditableAiModel;
};

export function AiModelPricingFields({ model }: AiModelPricingFieldsProps) {
  return (
    <ModelFieldSection title="Pricing">
      <div className="ai-model-edit-grid">
        {model.supportedResolutions.map((resolution) => (
          <ModelTextInput
            key={resolution}
            label={`${resolution} credits / sec`}
            min={0}
            name={priceField(resolution)}
            type="number"
            value={`${model.pricePerSecondByResolution[resolution] ?? 0}`}
          />
        ))}
        <ModelCheckbox checked={model.active} label="Active for users" name="active" />
      </div>
    </ModelFieldSection>
  );
}

function priceField(resolution: string) {
  return `pricePerSecond_${resolution}`;
}
