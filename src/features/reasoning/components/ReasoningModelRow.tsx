import type { EditableReasoningModel } from "../types";
import { ModelCheckbox } from "@/shared/model-form";
import { ModelReadonlyField } from "@/shared/model-form";
import { ReasoningModelConfigFields } from "./ReasoningModelConfigFields";
import { ReasoningModelStats } from "./ReasoningModelStats";

type ReasoningModelRowProps = {
  action: (formData: FormData) => void | Promise<void>;
  model: EditableReasoningModel;
};

export function ReasoningModelRow({ action, model }: ReasoningModelRowProps) {
  return (
    <form action={action} className="settings-panel model-form">
      {reasoningTitle(model)}
      {reasoningFields(model)}
      <ReasoningModelStats model={model} />
      <button className="button button-secondary" type="submit">Save reasoning model</button>
    </form>
  );
}

function reasoningTitle(model: EditableReasoningModel) {
  return <div className="model-row-title"><h2>{model.displayName}</h2><span className="badge">{model.provider}</span><span className="badge">{model.selected ? "global" : "standby"}</span></div>;
}

function reasoningFields(model: EditableReasoningModel) {
  return <div className="model-form-grid">{model.id ? <input name="id" type="hidden" value={model.id} /> : null}<input name="key" type="hidden" value={model.key} />{readonlyFields(model)}<ReasoningModelConfigFields model={model} /><ModelCheckbox checked={model.active} name="active" /><ModelCheckbox checked={model.selected} name="selected" /></div>;
}

function readonlyFields(model: EditableReasoningModel) {
  return <><ModelReadonlyField label="key" value={model.key} /><ModelReadonlyField label="provider model" value={model.providerModelId} /><ModelReadonlyField label="context" value={`${model.contextWindowTokens.toLocaleString()} tokens`} /><ModelReadonlyField label="input price" value={`$${model.inputTokenPriceUsdPerMillion}/M`} /><ModelReadonlyField label="output price" value={`$${model.outputTokenPriceUsdPerMillion}/M`} /></>;
}
