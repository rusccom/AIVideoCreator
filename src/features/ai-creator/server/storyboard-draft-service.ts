import { z } from "zod";
import type { ReasoningRequest, ReasoningRunner } from "@/shared/server/reasoning-types";
import { prisma } from "@/shared/server/prisma";
import { systemInstruction } from "@/shared/server/system-instructions";
import type { StoryboardDraftInput } from "./storyboard-draft-schema";
import { buildGridPrompt, buildShotPrompt, type StoryboardPanel } from "./storyboard-prompt-templates";

const panelsSchema = z.object({
  panels: z.array(z.object({
    action: z.string().min(1),
    camera: z.string().min(1),
    title: z.string().min(1)
  }))
});

const panelsJsonSchema = {
  type: "object",
  properties: {
    panels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          action: { type: "string" },
          camera: { type: "string" }
        },
        required: ["title", "action", "camera"],
        additionalProperties: false
      }
    }
  },
  required: ["panels"],
  additionalProperties: false
};

export async function draftStoryboard(
  userId: string,
  projectId: string,
  input: StoryboardDraftInput,
  runReasoning: ReasoningRunner
) {
  await assertProjectOwner(userId, projectId);
  const response = await runReasoning(reasoningRequest(input));
  const panels = normalizePanels(input, parsePanels(response.content));
  return {
    gridPrompt: buildGridPrompt(input, panels),
    panels,
    shotPrompt: buildShotPrompt(input, panels)
  };
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!project) throw new Error("Project not found");
}

function reasoningRequest(input: StoryboardDraftInput): ReasoningRequest {
  return {
    maxTokens: Math.min(2800, 600 + input.panelCount * 160),
    messages: [
      { role: "system", content: systemInstruction("aiCreatorStoryboard") },
      { role: "user", content: userPrompt(input) }
    ],
    responseFormat: responseFormat(),
    temperature: 0.6
  };
}

function userPrompt(input: StoryboardDraftInput) {
  return JSON.stringify({
    aspectRatio: input.aspectRatio,
    character: input.character,
    durationSeconds: input.durationSeconds,
    idea: input.idea,
    panelCount: input.panelCount
  });
}

function responseFormat() {
  return {
    type: "json_schema" as const,
    json_schema: { name: "ai_creator_storyboard", strict: true, schema: panelsJsonSchema }
  };
}

function parsePanels(content: string) {
  try {
    const result = panelsSchema.safeParse(JSON.parse(content));
    return result.success ? result.data.panels : [];
  } catch {
    return [];
  }
}

function normalizePanels(input: StoryboardDraftInput, drafts: StoryboardPanel[]): StoryboardPanel[] {
  return Array.from({ length: input.panelCount }, (_, index) => panel(input, drafts[index], index));
}

function panel(input: StoryboardDraftInput, draft: StoryboardPanel | undefined, index: number): StoryboardPanel {
  return {
    action: clean(draft?.action) || `Beat ${index + 1}: ${input.idea}`,
    camera: clean(draft?.camera) || "Slow cinematic push-in.",
    title: clean(draft?.title) || `Scene ${index + 1}`
  };
}

function clean(value?: string) {
  return value?.trim() ?? "";
}
