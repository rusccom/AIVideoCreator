import type { EditableAiModel } from "../types";
import { AiModelCapabilityFields } from "./AiModelCapabilityFields";
import { AiModelDetailFields } from "./AiModelDetailFields";
import { AiModelDurationFields } from "./AiModelDurationFields";
import { AiModelHiddenFields } from "./AiModelHiddenFields";
import { AiModelPricingFields } from "./AiModelPricingFields";

type AiModelFormFieldsProps = {
  model: EditableAiModel;
};

export function AiModelFormFields({ model }: AiModelFormFieldsProps) {
  return (
    <>
      <AiModelHiddenFields model={model} />
      <div className="ai-model-sections">
        <AiModelDetailFields model={model} />
        <AiModelCapabilityFields model={model} />
        <AiModelDurationFields model={model} />
        <AiModelPricingFields model={model} />
      </div>
    </>
  );
}
