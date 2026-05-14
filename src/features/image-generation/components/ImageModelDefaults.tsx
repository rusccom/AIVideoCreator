import type { EditableAiModel } from "@/shared/model-form";
import { ModelFieldSection } from "@/shared/model-form";
import { ModelReadonlyField } from "@/shared/model-form";

type ImageModelDefaultsProps = {
  model: EditableAiModel;
};

export function ImageModelDefaults({ model }: ImageModelDefaultsProps) {
  return (
    <ModelFieldSection title="Generation defaults">
      <div className="ai-model-info-grid">
        {defaultFields(model).map((field) => (
          <ModelReadonlyField key={field.label} label={field.label} value={field.value} />
        ))}
      </div>
    </ModelFieldSection>
  );
}

function defaultFields(model: EditableAiModel) {
  const defaults = model.imageDefaults;
  return [
    field("Model default images", `${defaults?.defaultNumImages ?? 1}`),
    field("Image size", defaults?.defaultImageSize),
    field("Aspect ratio", defaults?.defaultImageSize ? undefined : model.defaultAspectRatio),
    field("Resolution", defaults?.defaultImageSize ? undefined : model.defaultResolution),
    field("Quality", defaults?.defaultQuality),
    field("Format", defaults?.defaultOutputFormat ?? "png"),
    field("Safety", defaults?.defaultSafetyTolerance),
    field("Thinking", defaults?.defaultThinkingLevel),
    field("Limit generations", optionalYesNo(defaults?.defaultLimitGenerations)),
    field("Web search", optionalYesNo(defaults?.defaultEnableWebSearch))
  ].filter((item) => item.value);
}

function field(label: string, value?: string) {
  return { label, value: value ?? "" };
}

function optionalYesNo(value?: boolean) {
  return value === undefined ? undefined : yesNo(value);
}

function yesNo(value?: boolean) {
  return value ? "yes" : "no";
}
