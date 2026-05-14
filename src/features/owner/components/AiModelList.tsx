import type { EditableAiModel } from "@/shared/model-form";
import { AiModelRow } from "./AiModelRow";

type AiModelListProps = {
  action: (formData: FormData) => void | Promise<void>;
  models: EditableAiModel[];
};

export function AiModelList({ action, models }: AiModelListProps) {
  return (
    <div className="model-list">
      {models.map((model) => (
        <AiModelRow action={action} key={model.id} model={model} />
      ))}
    </div>
  );
}
