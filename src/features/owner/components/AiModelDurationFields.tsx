import type { EditableAiModel } from "@/shared/model-form";
import { ModelFieldSection, ModelReadonlyField } from "@/shared/model-form";

type AiModelDurationFieldsProps = {
  model: EditableAiModel;
};

export function AiModelDurationFields({ model }: AiModelDurationFieldsProps) {
  return (
    <ModelFieldSection title="Duration limits">
      <div className="ai-model-info-grid">
        <ModelReadonlyField label="Min seconds" value={`${model.minDurationSeconds}`} />
        <ModelReadonlyField label="Max seconds" value={`${model.maxDurationSeconds}`} />
        <ModelReadonlyField label="Default seconds" value={`${model.defaultDurationSeconds}`} />
      </div>
    </ModelFieldSection>
  );
}
