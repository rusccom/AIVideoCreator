import type { EditableAiModel } from "../types";
import { ModelFieldSection } from "./ModelFieldSection";
import { ModelTextInput } from "./ModelTextInput";

type AiModelDurationFieldsProps = {
  model: EditableAiModel;
};

export function AiModelDurationFields({ model }: AiModelDurationFieldsProps) {
  return (
    <ModelFieldSection title="Duration limits">
      <div className="ai-model-edit-grid">
        <ModelTextInput label="Min seconds" min={1} name="minDurationSeconds" type="number" value={`${model.minDurationSeconds}`} />
        <ModelTextInput label="Max seconds" min={1} name="maxDurationSeconds" type="number" value={`${model.maxDurationSeconds}`} />
        <ModelTextInput label="Default seconds" min={1} name="defaultDurationSeconds" type="number" value={`${model.defaultDurationSeconds}`} />
      </div>
    </ModelFieldSection>
  );
}
