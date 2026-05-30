import type { EditableAiModel } from "@/shared/model-form";
import { AiModelCapabilityFields } from "./AiModelCapabilityFields";
import { AiModelDetailFields } from "@/shared/model-form";
import { AiModelDurationFields } from "./AiModelDurationFields";
import { AiModelHiddenFields } from "./AiModelHiddenFields";
import { AiModelPricingFields } from "./AiModelPricingFields";

type AiModelFormFieldsProps = {
  creditsPerUsd: number;
  model: EditableAiModel;
};

export function AiModelFormFields({ creditsPerUsd, model }: AiModelFormFieldsProps) {
  return (
    <>
      <AiModelHiddenFields model={model} />
      <div className="ai-model-sections">
        <AiModelDetailFields model={model} />
        <AiModelCapabilityFields model={model} />
        <AiModelDurationFields model={model} />
        <AiModelPricingFields creditsPerUsd={creditsPerUsd} model={model} />
      </div>
    </>
  );
}
