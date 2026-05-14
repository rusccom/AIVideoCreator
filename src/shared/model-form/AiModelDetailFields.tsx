import type { EditableAiModel } from "./types";
import { ModelFieldSection } from "./ModelFieldSection";
import { ModelReadonlyField } from "./ModelReadonlyField";

type AiModelDetailFieldsProps = {
  model: EditableAiModel;
};

export function AiModelDetailFields({ model }: AiModelDetailFieldsProps) {
  return (
    <ModelFieldSection title="Model details">
      <div className="ai-model-info-grid">
        <ModelReadonlyField label="Key" value={model.key} />
        <ModelReadonlyField label="Provider model" value={model.providerModelId} />
        <ModelReadonlyField label="Type" value={model.type} />
        <ModelReadonlyField label="Quality" value={model.qualityTier} />
      </div>
    </ModelFieldSection>
  );
}
