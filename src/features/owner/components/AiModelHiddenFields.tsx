import type { EditableAiModel } from "../types";

type AiModelHiddenFieldsProps = {
  model: EditableAiModel;
};

export function AiModelHiddenFields({ model }: AiModelHiddenFieldsProps) {
  return (
    <>
      {model.id ? <input name="id" type="hidden" value={model.id} /> : null}
      <input name="key" type="hidden" value={model.key} />
    </>
  );
}
