import { prisma } from "@/shared/server/prisma";
import { generateVideoUseCase } from "../application/generate-video-use-case";
import { getCreditBalance } from "./credit-service";
import type { GenerateVideoInput, SelectStartImageInput } from "./generation-schema";
import { getModel } from "./model-registry";
import { estimateVideoCredits, resolveVideoInput } from "./pricing-service";

export async function selectStartImage(
  userId: string,
  projectId: string,
  input: SelectStartImageInput
) {
  await assertProjectOwner(userId, projectId);
  await assertAssetOwner(userId, input.assetId);
  return prisma.project.update({
    where: { id: projectId },
    data: { initialFrameAssetId: input.assetId, coverAssetId: input.assetId }
  });
}

export const generateVideo = generateVideoUseCase;

export async function preflightVideoGeneration(userId: string, projectId: string, input: GenerateVideoInput) {
  await assertProjectOwner(userId, projectId);
  const model = await getModel(input.modelId);
  const videoInput = resolveVideoInput(model, input);
  const credits = estimateVideoCredits(model, videoInput);
  await assertCredits(userId, credits);
  return { credits };
}

async function assertCredits(userId: string, credits: number) {
  const balance = await getCreditBalance(userId);
  if (balance < credits) throw new Error("Insufficient credits");
}

async function assertProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) throw new Error("Project not found");
}

async function assertAssetOwner(userId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
  if (!asset) throw new Error("Asset not found");
}
