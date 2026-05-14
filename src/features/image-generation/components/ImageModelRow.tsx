import type { EditableAiModel } from "@/shared/model-form";
import { AiModelDetailFields } from "@/shared/model-form";
import { AiModelHeader } from "@/shared/model-form";
import { ModelCheckbox } from "@/shared/model-form";
import { ModelFieldSection } from "@/shared/model-form";
import { ModelTextInput } from "@/shared/model-form";
import { ImageModelDefaults } from "./ImageModelDefaults";
import { ImageModelInputs } from "./ImageModelInputs";
import { ImageModelStats } from "./ImageModelStats";

type ImageModelRowProps = {
  action: (formData: FormData) => void | Promise<void>;
  model: EditableAiModel;
};

export function ImageModelRow({ action, model }: ImageModelRowProps) {
  return (
    <form action={action} className="settings-panel model-form ai-model-card">
      <AiModelHeader model={model} />
      {model.id ? <input name="id" type="hidden" value={model.id} /> : null}
      <input name="key" type="hidden" value={model.key} />
      {imageModelSections(model)}
      <div className="ai-model-actions"><button className="button button-secondary" type="submit">Save image model</button></div>
    </form>
  );
}

function imageModelSections(model: EditableAiModel) {
  return <div className="ai-model-sections"><AiModelDetailFields model={model} /><ImageModelInputs model={model} /><ImageModelDefaults model={model} />{creatorSection(model)}<ImageModelStats model={model} />{availabilitySection(model)}</div>;
}

function creatorSection(model: EditableAiModel) {
  return <ModelFieldSection title="AI Creator"><div className="ai-model-edit-grid"><ModelTextInput label="Images per scene" min={1} name="aiCreatorImageCount" type="number" value={`${model.aiCreatorImageCount}`} /></div></ModelFieldSection>;
}

function availabilitySection(model: EditableAiModel) {
  return <ModelFieldSection title="Availability"><ModelCheckbox checked={model.active} label="Active for users" name="active" /></ModelFieldSection>;
}
