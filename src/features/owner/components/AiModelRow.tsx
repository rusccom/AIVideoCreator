import type { EditableAiModel } from "@/shared/model-form";
import { AiModelFormFields } from "./AiModelFormFields";
import { AiModelHeader } from "@/shared/model-form";

type AiModelRowProps = {
  action: (formData: FormData) => void | Promise<void>;
  model: EditableAiModel;
};

export function AiModelRow({ action, model }: AiModelRowProps) {
  return (
    <form action={action} className="settings-panel model-form ai-model-card">
      <AiModelHeader model={model} />
      <AiModelFormFields model={model} />
      <div className="ai-model-actions">
        <button className="button button-secondary" type="submit">
          Save model
        </button>
      </div>
    </form>
  );
}
