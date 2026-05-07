import type { EditableAiModel } from "@/features/owner/types";
import { ModelFieldSection } from "@/features/owner/components/ModelFieldSection";
import { ModelReadonlyField } from "@/features/owner/components/ModelReadonlyField";

type ImageModelStatsProps = {
  model: EditableAiModel;
};

export function ImageModelStats({ model }: ImageModelStatsProps) {
  return (
    <ModelFieldSection title="Owner usage">
      <div className="ai-model-info-grid">
        <ModelReadonlyField label="Requests" value={format(model.usageRequestCount)} />
        <ModelReadonlyField label="Generated photos" value={format(model.usageGeneratedImages)} />
        <ModelReadonlyField label="Last used" value={lastUsed(model.lastUsedAt)} />
      </div>
    </ModelFieldSection>
  );
}

function format(value: number) {
  return value.toLocaleString();
}

function lastUsed(value?: Date | null) {
  return value ? value.toLocaleString("en-US") : "never";
}
