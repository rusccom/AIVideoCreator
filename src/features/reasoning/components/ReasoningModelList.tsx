import type { EditableReasoningModel } from "../types";
import { ReasoningModelRow } from "./ReasoningModelRow";

type ReasoningModelListProps = {
  action: (formData: FormData) => void | Promise<void>;
  models: EditableReasoningModel[];
};

export function ReasoningModelList({ action, models }: ReasoningModelListProps) {
  return (
    <div className="model-list">
      {models.map((model) => (
        <ReasoningModelRow action={action} key={model.id} model={model} />
      ))}
    </div>
  );
}
