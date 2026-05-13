export async function retryCreatorSequence(sequenceId: string) {
  const response = await fetch(sequenceUrl(sequenceId, "retry"), { method: "POST" });
  if (!response.ok) throw new Error(await responseError(response, "Retry could not start."));
  return response.json() as Promise<{ job: { id: string; status: string } }>;
}

export async function updateCreatorSequencePrompt(sequenceId: string, prompt: string) {
  const response = await fetch(sequenceUrl(sequenceId, "prompt"), patchJson({ prompt }));
  if (!response.ok) throw new Error(await responseError(response, "Prompt could not be saved."));
  return response.json() as Promise<{ scene: { id: string; userPrompt: string } }>;
}

export async function repairCreatorSequencePrompt(sequenceId: string, prompt: string) {
  const response = await fetch(sequenceUrl(sequenceId, "prompt/repair"), postJson({ prompt }));
  if (!response.ok) throw new Error(await responseError(response, "Prompt could not be repaired."));
  return response.json() as Promise<{ prompt: string }>;
}

function sequenceUrl(sequenceId: string, path: string) {
  return `/api/ai-creator/sequences/${encodeURIComponent(sequenceId)}/${path}`;
}

function postJson(body: unknown) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function patchJson(body: unknown) {
  return {
    ...postJson(body),
    method: "PATCH"
  };
}

async function responseError(response: Response, fallback: string) {
  try {
    const data = await response.json() as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}
