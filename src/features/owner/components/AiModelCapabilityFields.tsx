import type { EditableAiModel } from "@/shared/model-form";
import { ModelChipList, ModelFieldSection, ModelReadonlyField } from "@/shared/model-form";

type AiModelCapabilityFieldsProps = {
  model: EditableAiModel;
};

export function AiModelCapabilityFields({ model }: AiModelCapabilityFieldsProps) {
  return (
    <ModelFieldSection title="Supported inputs">
      <div className="ai-model-info-grid">
        <ModelChipList label="Aspect ratios" values={model.supportedAspectRatios} />
        <ModelChipList label="Resolutions" values={model.supportedResolutions} />
        <ModelReadonlyField label="Start frame" value={model.supportsStartFrame ? "yes" : "no"} />
        <ModelReadonlyField label="End frame" value={model.supportsEndFrame ? "yes" : "no"} />
        <ModelReadonlyField label="Seed" value={model.supportsSeed ? "yes" : "no"} />
      </div>
    </ModelFieldSection>
  );
}
