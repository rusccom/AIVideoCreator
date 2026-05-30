import type { EditableAiModel } from "@/shared/model-form";
import { AiModelRow } from "./AiModelRow";

type AiModelListProps = {
  action: (formData: FormData) => void | Promise<void>;
  creditsPerUsd: number;
  models: EditableAiModel[];
};

export function AiModelList({ action, creditsPerUsd, models }: AiModelListProps) {
  return (
    <div className="model-list">
      {models.map((model) => (
        <AiModelRow action={action} creditsPerUsd={creditsPerUsd} key={model.id} model={model} />
      ))}
    </div>
  );
}
