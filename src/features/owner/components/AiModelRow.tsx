import type { EditableAiModel } from "../types";
import { updateAiModelAction } from "@/features/admin/server/ai-model-actions";
import { AiModelFormFields } from "./AiModelFormFields";
import { AiModelHeader } from "./AiModelHeader";

type AiModelRowProps = {
  model: EditableAiModel;
};

export function AiModelRow({ model }: AiModelRowProps) {
  return (
    <form action={updateAiModelAction} className="settings-panel model-form ai-model-card">
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
