import type { AiCreatorIdeaFormState, AiCreatorSceneDraft } from "./types";

export async function generateCreatorScenes(projectId: string, form: AiCreatorIdeaFormState) {
  const response = await fetch(`/api/projects/${projectId}/ai-creator/scenes`, requestOptions(form));
  if (!response.ok) throw new Error("Scene draft generation failed.");
  const data = await response.json() as { scenes?: AiCreatorSceneDraft[] };
  return data.scenes ?? [];
}

function requestOptions(form: AiCreatorIdeaFormState) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody(form))
  };
}

function requestBody(form: AiCreatorIdeaFormState) {
  return {
    aspectRatio: form.aspectRatio,
    durationSeconds: form.durationSeconds,
    idea: form.idea,
    imageModelId: form.imageModelId,
    videoModelId: form.videoModelId
  };
}
