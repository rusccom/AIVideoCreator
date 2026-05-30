"use client";

import { useState } from "react";
import type { EditableAiModel } from "@/shared/model-form";
import { Modal } from "@/shared/ui/Modal";
import { OwnerEntityList, type OwnerEntityItem } from "@/shared/ui/OwnerEntityList";
import { ImageModelRow } from "./ImageModelRow";

type ImageModelListModalProps = {
  action: (formData: FormData) => void | Promise<void>;
  emptyLabel?: string;
  models: EditableAiModel[];
};

export function ImageModelListModal({ action, emptyLabel, models }: ImageModelListModalProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = models.find((model) => modelId(model) === openId);
  return (
    <>
      <OwnerEntityList emptyLabel={emptyLabel} items={models.map(toItem)} onOpen={setOpenId} />
      {open ? (
        <Modal onClose={() => setOpenId(null)} subtitle={open.providerModelId} title={open.displayName}>
          <ImageModelRow action={action} model={open} />
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
