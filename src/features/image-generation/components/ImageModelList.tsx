import type { EditableAiModel } from "@/shared/model-form";
import { ImageModelRow } from "./ImageModelRow";

type ImageModelListProps = {
  action: (formData: FormData) => void | Promise<void>;
  models: EditableAiModel[];
};

export function ImageModelList({ action, models }: ImageModelListProps) {
  return (
    <div className="model-list">
      {models.map((model) => (
        <ImageModelRow action={action} key={model.id} model={model} />
      ))}
    </div>
  );
}
