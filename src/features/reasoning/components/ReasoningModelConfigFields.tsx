import type { EditableReasoningModel } from "../types";
import { ModelCheckbox } from "@/shared/model-form";

type ReasoningModelConfigFieldsProps = {
  model: EditableReasoningModel;
};

const effortOptions = ["xhigh", "high", "medium", "low", "minimal", "none"];

export function ReasoningModelConfigFields({ model }: ReasoningModelConfigFieldsProps) {
  return (
    <>
      <label className="model-input">
        <span>reasoning effort</span>
        <select defaultValue={model.reasoningEffort} name="reasoningEffort">
          {effortOptions.map((effort) => <option key={effort}>{effort}</option>)}
        </select>
      </label>
      <ModelCheckbox checked={model.excludeReasoning} label="hide reasoning" name="excludeReasoning" />
    </>
  );
}
