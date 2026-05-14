import type { EditableAiModel } from "./types";

type AiModelHeaderProps = {
  model: EditableAiModel;
};

export function AiModelHeader({ model }: AiModelHeaderProps) {
  return (
    <div className="ai-model-card-header">
      <div>
        <h2>{model.displayName}</h2>
        <p>{model.providerModelId}</p>
      </div>
      <div className="ai-model-badges">
        <span className="badge">{model.provider}</span>
        <span className="badge">{model.active ? "active" : "disabled"}</span>
      </div>
    </div>
  );
}
