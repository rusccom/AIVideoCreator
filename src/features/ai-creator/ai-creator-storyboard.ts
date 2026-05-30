export type StoryboardDraftRequest = {
  aspectRatio?: string;
  character: string;
  durationSeconds: number;
  idea: string;
  panelCount: number;
};

export type StoryboardPanelDraft = {
  action: string;
  camera: string;
  title: string;
};

export type StoryboardDraft = {
  gridPrompt: string;
  panels: StoryboardPanelDraft[];
  shotPrompt: string;
};

export async function draftStoryboard(projectId: string, request: StoryboardDraftRequest) {
  const response = await fetch(`/api/projects/${projectId}/storyboard/draft`, postJson(request));
  if (!response.ok) throw new Error(await responseError(response, "Storyboard planning could not start."));
  return response.json() as Promise<StoryboardDraft>;
}

function postJson(body: unknown) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
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
