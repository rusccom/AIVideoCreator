import { startProjectImageGeneration as startImageGeneration } from "@/features/image-generation/server/project-image-service";
import { processDeferredFalWebhook } from "@/application/generation/server";
export { completeProjectImageGeneration } from "@/features/image-generation/server/project-image-service";
export { generateProjectImageSchema } from "@/features/image-generation/server/image-generation-schema";
import type { GenerateProjectImageInput } from "@/features/image-generation/server/image-generation-schema";

export function startProjectImageGeneration(
  userId: string,
  projectId: string,
  input: GenerateProjectImageInput
) {
  return startImageGeneration(userId, projectId, input, processDeferredFalWebhook);
}
