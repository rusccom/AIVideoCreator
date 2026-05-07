import type { EditableAiModel } from "@/features/owner/types";
import { ImageModelRow } from "./ImageModelRow";

type ImageModelListProps = {
  models: EditableAiModel[];
};

export function ImageModelList({ models }: ImageModelListProps) {
  return (
    <div className="model-list">
      {models.map((model) => (
        <ImageModelRow key={model.id} model={model} />
      ))}
    </div>
  );
}
