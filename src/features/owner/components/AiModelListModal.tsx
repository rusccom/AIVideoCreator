"use client";

import { useState } from "react";
import type { EditableAiModel } from "@/shared/model-form";
import { Modal } from "@/shared/ui/Modal";
import { OwnerEntityList, type OwnerEntityItem } from "@/shared/ui/OwnerEntityList";
import { AiModelRow } from "./AiModelRow";

type AiModelListModalProps = {
  action: (formData: FormData) => void | Promise<void>;
  creditsPerUsd: number;
  emptyLabel?: string;
  models: EditableAiModel[];
};

export function AiModelListModal({ action, creditsPerUsd, emptyLabel, models }: AiModelListModalProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = models.find((model) => modelId(model) === openId);
  return (
    <>
      <OwnerEntityList emptyLabel={emptyLabel} items={models.map(toItem)} onOpen={setOpenId} />
      {open ? (
        <Modal onClose={() => setOpenId(null)} subtitle={open.providerModelId} title={open.displayName}>
          <AiModelRow action={action} creditsPerUsd={creditsPerUsd} model={open} />
        </Modal>
      ) : null}
    </>
  );
}

function toItem(model: EditableAiModel): OwnerEntityItem {
  return {
    id: modelId(model),
    subtitle: model.providerModelId,
    status: model.active ? "active" : "disabled",
    title: model.displayName
  };
}

function modelId(model: EditableAiModel) {
  return model.id ?? model.key;
}
