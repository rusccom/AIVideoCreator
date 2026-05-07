import type { EditableAiModel } from "@/features/owner/types";
import { AiModelDetailFields } from "@/features/owner/components/AiModelDetailFields";
import { AiModelHeader } from "@/features/owner/components/AiModelHeader";
import { ModelCheckbox } from "@/features/owner/components/ModelCheckbox";
import { ModelFieldSection } from "@/features/owner/components/ModelFieldSection";
import { updateImageModelAction } from "../server/image-model-actions";
import { ImageModelDefaults } from "./ImageModelDefaults";
import { ImageModelInputs } from "./ImageModelInputs";
import { ImageModelStats } from "./ImageModelStats";

type ImageModelRowProps = {
  model: EditableAiModel;
};

export function ImageModelRow({ model }: ImageModelRowProps) {
  return (
    <form action={updateImageModelAction} className="settings-panel model-form ai-model-card">
      <AiModelHeader model={model} />
      {model.id ? <input name="id" type="hidden" value={model.id} /> : null}
      <input name="key" type="hidden" value={model.key} />
      <div className="ai-model-sections">
        <AiModelDetailFields model={model} />
        <ImageModelInputs model={model} />
        <ImageModelDefaults model={model} />
        <ImageModelStats model={model} />
        <ModelFieldSection title="Availability">
          <ModelCheckbox checked={model.active} label="Active for users" name="active" />
        </ModelFieldSection>
      </div>
      <div className="ai-model-actions">
        <button className="button button-secondary" type="submit">
          Save image model
        </button>
      </div>
    </form>
  );
}
