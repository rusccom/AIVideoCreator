import { reasoningModelSchema } from "./reasoning-model-schema";

export function parseReasoningModelForm(formData: FormData) {
  return reasoningModelSchema.parse({
    id: optionalString(formData.get("id")),
    key: value(formData, "key"),
    active: formData.has("active"),
    selected: formData.has("selected"),
    reasoningEffort: value(formData, "reasoningEffort"),
    excludeReasoning: formData.has("excludeReasoning")
  });
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text.length > 0 ? text : undefined;
}
