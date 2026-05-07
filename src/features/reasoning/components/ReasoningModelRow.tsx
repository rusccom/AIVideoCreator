import { updateReasoningModelAction } from "../server/reasoning-model-actions";
import type { EditableReasoningModel } from "../types";
import { ModelCheckbox } from "@/features/owner/components/ModelCheckbox";
import { ModelReadonlyField } from "@/features/owner/components/ModelReadonlyField";
import { ReasoningModelConfigFields } from "./ReasoningModelConfigFields";
import { ReasoningModelStats } from "./ReasoningModelStats";

type ReasoningModelRowProps = {
  model: EditableReasoningModel;
};

export function ReasoningModelRow({ model }: ReasoningModelRowProps) {
  return (
    <form action={updateReasoningModelAction} className="settings-panel model-form">
      <div className="model-row-title">
        <h2>{model.displayName}</h2>
        <span className="badge">{model.provider}</span>
        <span className="badge">{model.selected ? "global" : "standby"}</span>
      </div>
      <div className="model-form-grid">
        {model.id ? <input name="id" type="hidden" value={model.id} /> : null}
        <input name="key" type="hidden" value={model.key} />
        <ModelReadonlyField label="key" value={model.key} />
        <ModelReadonlyField label="provider model" value={model.providerModelId} />
        <ModelReadonlyField label="context" value={`${model.contextWindowTokens.toLocaleString()} tokens`} />
        <ModelReadonlyField label="input price" value={`$${model.inputTokenPriceUsdPerMillion}/M`} />
        <ModelReadonlyField label="output price" value={`$${model.outputTokenPriceUsdPerMillion}/M`} />
        <ReasoningModelConfigFields model={model} />
        <ModelCheckbox checked={model.active} name="active" />
        <ModelCheckbox checked={model.selected} name="selected" />
      </div>
      <ReasoningModelStats model={model} />
      <button className="button button-secondary" type="submit">
        Save reasoning model
      </button>
    </form>
  );
}
