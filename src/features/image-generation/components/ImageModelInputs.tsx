import type { EditableAiModel } from "@/shared/model-form";
import { ModelChipList } from "@/shared/model-form";
import { ModelFieldSection } from "@/shared/model-form";
import { ModelReadonlyField } from "@/shared/model-form";

type ImageModelInputsProps = {
  model: EditableAiModel;
};

export function ImageModelInputs({ model }: ImageModelInputsProps) {
  return (
    <ModelFieldSection title="Supported inputs">
      <div className="ai-model-info-grid">
        {inputGroups(model).map((group) => (
          <ModelChipList key={group.label} label={group.label} values={group.values} />
        ))}
        <ModelReadonlyField label="Seed" value={model.supportsSeed ? "yes" : "no"} />
      </div>
    </ModelFieldSection>
  );
}

function inputGroups(model: EditableAiModel) {
  const defaults = model.imageDefaults;
  return [
    group("Image sizes", defaults?.supportedImageSizes),
    group("Aspect ratios", model.supportedAspectRatios),
    group("Resolutions", model.supportedResolutions),
    group("Qualities", defaults?.supportedQualities),
    group("Output formats", defaults?.supportedOutputFormats),
    group("Safety levels", defaults?.safetyToleranceLevels),
    group("Thinking levels", defaults?.supportedThinkingLevels)
  ].filter((item) => item.values.length > 0);
}

function group(label: string, values?: string[]) {
  return { label, values: values ?? [] };
}
