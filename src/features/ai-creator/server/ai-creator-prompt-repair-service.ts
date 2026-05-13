import { runReasoning, type ReasoningRequest } from "@/features/reasoning/server/reasoning-runtime";
import { prisma } from "@/shared/server/prisma";
import { systemInstruction } from "@/shared/server/system-instructions";
import type { AiCreatorPromptInput } from "./ai-creator-prompt-schema";

export async function repairAiCreatorPrompt(
  userId: string,
  sequenceId: string,
  input: AiCreatorPromptInput
) {
  await assertFailedSequence(userId, sequenceId);
  const response = await runReasoning(repairRequest(input.prompt));
  return { prompt: cleanPrompt(response.content, input.prompt) };
}

async function assertFailedSequence(userId: string, sequenceId: string) {
  const scene = await prisma.scene.findFirst({
    where: { branchId: sequenceId, project: { userId }, status: "FAILED" },
    select: { id: true }
  });
  if (!scene) throw new Error("Failed scene not found");
}

function repairRequest(prompt: string): ReasoningRequest {
  return {
    maxTokens: 900,
    messages: [
      { role: "system", content: systemInstruction("aiCreatorPromptRepair") },
      { role: "user", content: JSON.stringify({ rejectedPrompt: prompt }) }
    ],
    temperature: 0.25
  };
}

function cleanPrompt(content: string, fallback: string) {
  const prompt = stripFence(content).trim();
  return prompt ? prompt.slice(0, 2000) : fallback;
}

function stripFence(content: string) {
  return content.replace(/^```(?:text)?/i, "").replace(/```$/i, "");
}
