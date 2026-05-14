import { aiModelSchema } from "./ai-model-schema";
import { supportedModels } from "@/shared/generation/models";

export function parseAiModelForm(formData: FormData) {
  const key = value(formData, "key");
  const model = supportedModels.find((item) => item.id === key);
  return aiModelSchema.parse({
    id: optionalString(formData.get("id")),
    key,
    active: formData.has("active"),
    pricePerSecondByResolution: priceMap(formData, model?.supportedResolutions ?? [])
  });
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function numberValue(formData: FormData, key: string) {
  return Number(value(formData, key));
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text.length > 0 ? text : undefined;
}

function priceMap(formData: FormData, resolutions: string[]) {
  return Object.fromEntries(resolutions.map((item) => [item, numberValue(formData, priceField(item))]));
}

function priceField(resolution: string) {
  return `pricePerSecond_${resolution}`;
}
