import type { EditableAiModel } from "@/shared/model-form";
import { AiModelFormFields } from "./AiModelFormFields";

type AiModelRowProps = {
  action: (formData: FormData) => void | Promise<void>;
  creditsPerUsd: number;
  model: EditableAiModel;
};

export function AiModelRow({ action, creditsPerUsd, model }: AiModelRowProps) {
  return (
    <form action={action} className="model-form ai-model-card">
      <AiModelFormFields creditsPerUsd={creditsPerUsd} model={model} />
      <div className="ai-model-actions">
        <button className="button button-secondary" type="submit">
          Save model
        </button>
      </div>
    </form>
  );
}
