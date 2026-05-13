import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/server/prisma";
import type { CreateVideoGenerationJobInput, GenerationJobRepository } from "../domain/generation-job";

export const prismaGenerationJobRepository: GenerationJobRepository = {
  createVideoJob,
  markSceneGenerating,
  setProviderRequest
};

async function createVideoJob(input: CreateVideoGenerationJobInput) {
  return prisma.generationJob.create({
    data: {
      estimatedCredits: input.estimatedCredits,
      input: asJson(input.input),
      modelId: input.modelId,
      projectId: input.projectId,
      provider: "fal",
      sceneId: input.sceneId,
      type: "VIDEO_GENERATION",
      userId: input.userId
    }
  });
}

async function setProviderRequest(jobId: string, requestId: string) {
  return prisma.generationJob.update({
    where: { id: jobId },
    data: { providerRequestId: requestId, status: "GENERATING", startedAt: new Date() }
  });
}

async function markSceneGenerating(sceneId: string, jobId: string) {
  await prisma.scene.update({
    where: { id: sceneId },
    data: { generationJobId: jobId, status: "GENERATING" }
  });
}

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
