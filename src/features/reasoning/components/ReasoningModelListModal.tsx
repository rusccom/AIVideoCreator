"use client";

import { useState } from "react";
import type { EditableReasoningModel } from "../types";
import { Modal } from "@/shared/ui/Modal";
import { OwnerEntityList, type OwnerEntityItem } from "@/shared/ui/OwnerEntityList";
import { ReasoningModelRow } from "./ReasoningModelRow";

type ReasoningModelListModalProps = {
  action: (formData: FormData) => void | Promise<void>;
  models: EditableReasoningModel[];
};

export function ReasoningModelListModal({ action, models }: ReasoningModelListModalProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = models.find((model) => modelId(model) === openId);
  return (
    <>
      <OwnerEntityList emptyLabel="No intelligence models." items={models.map(toItem)} onOpen={setOpenId} />
      {open ? (
        <Modal onClose={() => setOpenId(null)} subtitle={open.providerModelId} title={open.displayName}>
          <ReasoningModelRow action={action} model={open} />
        </Modal>
      ) : null}
    </>
  );
}

function toItem(model: EditableReasoningModel): OwnerEntityItem {
  return {
    id: modelId(model),
    subtitle: model.providerModelId,
    status: model.selected ? "global" : model.active ? "active" : "standby",
    title: model.displayName
  };
}

function modelId(model: EditableReasoningModel) {
  return model.id ?? model.key;
}
