import type { EditableAiModel } from "../types";
import { AiModelRow } from "./AiModelRow";

type AiModelListProps = {
  models: EditableAiModel[];
};

export function AiModelList({ models }: AiModelListProps) {
  return (
    <div className="model-list">
      {models.map((model) => (
        <AiModelRow key={model.id} model={model} />
      ))}
    </div>
  );
}
