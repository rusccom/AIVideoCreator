"use client";

import { Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

type AiCreatorPromptEditModalProps = {
  initialPrompt: string;
  onCancel: () => void;
  onRepair: (prompt: string) => Promise<string>;
  onSave: (prompt: string) => Promise<void>;
};

type EditStatus = "editing" | "repairing" | "saving";

export function AiCreatorPromptEditModal(props: AiCreatorPromptEditModalProps) {
  const [prompt, setPrompt] = useState(props.initialPrompt);
  const [status, setStatus] = useState<EditStatus>("editing");
  const [error, setError] = useState("");

  async function repairPrompt() {
    setStatus("repairing");
    setError("");
    try {
      setPrompt(await props.onRepair(prompt));
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setStatus("editing");
    }
  }

  async function savePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");
    try {
      await props.onSave(prompt);
    } catch (error) {
      setError(errorMessage(error));
      setStatus("editing");
    }
  }

  return (
    <div className="ai-creator-nested-backdrop">
      <form className="ai-creator-idea-modal ai-creator-prompt-modal" onSubmit={savePrompt}>
        <label>
          Запрос
          <textarea disabled={status !== "editing"} onChange={(event) => setPrompt(event.target.value)} value={prompt} />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="ai-creator-prompt-actions">
          <button className="button button-secondary" disabled={status !== "editing"} onClick={repairPrompt} type="button">
            <Sparkles size={16} /> Использовать ИИ
          </button>
          <span />
          <button className="button button-secondary" disabled={status !== "editing"} onClick={props.onCancel} type="button">
            Отмена
          </button>
          <button className="button button-primary" disabled={saveDisabled(prompt, status)} type="submit">
            {status === "saving" ? "Сохранение..." : "Окей"}
          </button>
        </div>
      </form>
    </div>
  );
}

function saveDisabled(prompt: string, status: EditStatus) {
  return status !== "editing" || prompt.trim().length === 0;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Prompt update failed.";
}
