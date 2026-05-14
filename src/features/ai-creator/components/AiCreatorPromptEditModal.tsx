"use client";

import { Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";

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
  return <div className="ai-creator-nested-backdrop"><form className="ai-creator-idea-modal ai-creator-prompt-modal" onSubmit={savePrompt(props, prompt, setError, setStatus)}>{promptField(prompt, status, setPrompt)}{error ? <div className="form-error">{error}</div> : null}{promptActions(props, prompt, status, { setError, setPrompt, setStatus })}</form></div>;
}

function promptField(prompt: string, status: EditStatus, setPrompt: SetPrompt) {
  return <label>Prompt<textarea disabled={status !== "editing"} onChange={(event) => setPrompt(event.target.value)} value={prompt} /></label>;
}

function promptActions(props: AiCreatorPromptEditModalProps, prompt: string, status: EditStatus, setters: PromptSetters) {
  return <div className="ai-creator-prompt-actions"><button className="button button-secondary" disabled={status !== "editing"} onClick={repairPrompt(props, prompt, setters.setPrompt, setters.setError, setters.setStatus)} type="button"><Sparkles size={16} /> Use AI</button><span /><button className="button button-secondary" disabled={status !== "editing"} onClick={props.onCancel} type="button">Cancel</button><button className="button button-primary" disabled={saveDisabled(prompt, status)} type="submit">{status === "saving" ? "Saving..." : "OK"}</button></div>;
}

function repairPrompt(props: AiCreatorPromptEditModalProps, prompt: string, setPrompt: SetPrompt, setError: SetText, setStatus: SetStatus) {
  return async () => {
    setStatus("repairing");
    setError("");
    try {
      setPrompt(await props.onRepair(prompt));
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setStatus("editing");
    }
  };
}

function savePrompt(props: AiCreatorPromptEditModalProps, prompt: string, setError: SetText, setStatus: SetStatus) {
  return async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    setError("");
    try {
      await props.onSave(prompt);
    } catch (error) {
      setError(errorMessage(error));
      setStatus("editing");
    }
  };
}

function saveDisabled(prompt: string, status: EditStatus) {
  return status !== "editing" || prompt.trim().length === 0;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Prompt update failed.";
}

type SetPrompt = (value: string) => void;
type SetStatus = (value: EditStatus) => void;
type SetText = (value: string) => void;
type PromptSetters = { setError: SetText; setPrompt: SetPrompt; setStatus: SetStatus };
