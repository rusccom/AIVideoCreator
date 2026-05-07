import type { EditableReasoningModel } from "../types";
import { ReasoningModelRow } from "./ReasoningModelRow";

type ReasoningModelListProps = {
  models: EditableReasoningModel[];
};

export function ReasoningModelList({ models }: ReasoningModelListProps) {
  return (
    <div className="model-list">
      {models.map((model) => (
        <ReasoningModelRow key={model.id} model={model} />
      ))}
    </div>
  );
}
