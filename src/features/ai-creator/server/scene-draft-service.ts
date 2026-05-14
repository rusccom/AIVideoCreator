import { z } from "zod";
import type { ReasoningRequest, ReasoningRunner } from "@/shared/server/reasoning-types";
import { prisma } from "@/shared/server/prisma";
import { systemInstruction } from "@/shared/server/system-instructions";
import { DEFAULT_SCENE_DURATION_SECONDS } from "../config";
import type { AiCreatorSceneDraft } from "../types";
import type { AiCreatorSceneDraftInput } from "./scene-draft-schema";

const sceneDraftsSchema = z.object({
  scenes: z.array(z.object({
    imagePrompt: z.string().min(1),
    text: z.string().min(1)
  }))
});

const sceneDraftJsonSchema = {
  type: "object",
  properties: {
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          imagePrompt: { type: "string" }
        },
        required: ["text", "imagePrompt"],
        additionalProperties: false
      }
    }
  },
  required: ["scenes"],
  additionalProperties: false
};

export async function draftAiCreatorScenes(
  userId: string,
  projectId: string,
  input: AiCreatorSceneDraftInput,
  runReasoning: ReasoningRunner
) {
  await assertProjectOwner(userId, projectId);
  const response = await runReasoning(reasoningRequest(input));
  const scenes = parseScenes(response.content);
  return { scenes: normalizeScenes(input, scenes) };
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new Error("Project not found");
}

function reasoningRequest(input: AiCreatorSceneDraftInput): ReasoningRequest {
  return {
    maxTokens: tokenBudget(input.durationSeconds),
    messages: [
      { role: "system", content: systemInstruction("aiCreatorSceneDrafts") },
      { role: "user", content: userPrompt(input) }
    ],
    responseFormat: responseFormat(),
    temperature: 0.55
  };
}

function userPrompt(input: AiCreatorSceneDraftInput) {
  return JSON.stringify({
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
    idea: input.idea,
    segments: sceneSegments(input.durationSeconds)
  });
}

function responseFormat() {
  return {
    type: "json_schema" as const,
    json_schema: {
      name: "ai_creator_scene_drafts",
      strict: true,
      schema: sceneDraftJsonSchema
    }
  };
}

function parseScenes(content: string) {
  try {
    const result = sceneDraftsSchema.safeParse(JSON.parse(content));
    return result.success ? result.data.scenes : [];
  } catch {
    return [];
  }
}

function normalizeScenes(input: AiCreatorSceneDraftInput, drafts: GeneratedSceneDraft[]) {
  return sceneSegments(input.durationSeconds).map((segment, index) => {
    const draft = drafts[index];
    return sceneDraft(input, segment, index, draft);
  });
}

function sceneDraft(
  input: AiCreatorSceneDraftInput,
  segment: SceneSegment,
  index: number,
  draft?: GeneratedSceneDraft
): AiCreatorSceneDraft {
  return {
    id: `scene-${index + 1}`,
    imagePrompt: clean(draft?.imagePrompt) || fallbackImagePrompt(input, index),
    name: `Scene ${index + 1}`,
    range: `${segment.start}-${segment.end}s`,
    text: clean(draft?.text) || fallbackText(input, index)
  };
}

function sceneSegments(durationSeconds: number): SceneSegment[] {
  const count = Math.max(1, Math.ceil(durationSeconds / DEFAULT_SCENE_DURATION_SECONDS));
  return Array.from({ length: count }, (_, index) => segment(durationSeconds, index));
}

function segment(durationSeconds: number, index: number) {
  const start = index * DEFAULT_SCENE_DURATION_SECONDS;
  return {
    start,
    end: Math.min(start + DEFAULT_SCENE_DURATION_SECONDS, durationSeconds)
  };
}

function tokenBudget(durationSeconds: number) {
  const count = Math.ceil(durationSeconds / DEFAULT_SCENE_DURATION_SECONDS);
  return Math.min(2800, 520 + count * 180);
}

function fallbackImagePrompt(input: AiCreatorSceneDraftInput, index: number) {
  return `Cinematic first frame for scene ${index + 1}, ${input.aspectRatio ?? "16:9"} aspect ratio. ${input.idea}`;
}

function fallbackText(input: AiCreatorSceneDraftInput, index: number) {
  return ideaChunk(input.idea, sceneSegments(input.durationSeconds).length, index);
}

function ideaChunk(idea: string, count: number, index: number) {
  const words = idea.trim().split(/\s+/);
  const size = Math.max(1, Math.ceil(words.length / count));
  return words.slice(index * size, (index + 1) * size).join(" ") || idea;
}

function clean(value?: string) {
  return value?.trim() ?? "";
}

type GeneratedSceneDraft = z.infer<typeof sceneDraftsSchema>["scenes"][number];

type SceneSegment = {
  end: number;
  start: number;
};
