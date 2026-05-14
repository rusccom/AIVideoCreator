export { cleanupFailedAiCreatorSequence } from "@/shared/server/ai-creator-sequence-cleanup";
import {
  getAiCreatorSequenceStatus as getSequenceStatus,
  retryFailedAiCreatorScene as retrySequenceScene,
  startNextAiCreatorScene as startNextScene,
  updateFailedAiCreatorPrompt
} from "@/features/ai-creator/server/ai-creator-sequence-service";
import { repairAiCreatorPrompt as repairPrompt } from "@/features/ai-creator/server/ai-creator-prompt-repair-service";
export { aiCreatorPromptSchema } from "@/features/ai-creator/server/ai-creator-prompt-schema";
import { draftAiCreatorScenes as draftScenes } from "@/features/ai-creator/server/scene-draft-service";
export { aiCreatorSceneDraftSchema } from "@/features/ai-creator/server/scene-draft-schema";
import { startAiCreatorVideo as startVideo } from "@/features/ai-creator/server/ai-creator-video-service";
export { aiCreatorVideoSchema } from "@/features/ai-creator/server/ai-creator-video-schema";
import { createSceneForUser, generateVideo, getCreditBalance } from "@/application/generation/server";
import { getModel, preflightVideoGeneration, selectStartImage } from "@/application/generation/server";
import { runReasoning } from "@/application/reasoning/server";
import type { AiCreatorPromptInput } from "@/features/ai-creator/server/ai-creator-prompt-schema";
import type { AiCreatorSceneDraftInput } from "@/features/ai-creator/server/scene-draft-schema";
import type { AiCreatorVideoInput } from "@/features/ai-creator/server/ai-creator-video-schema";

const generation = {
  createSceneForUser,
  generateVideo,
  getCreditBalance,
  getModel,
  preflightVideoGeneration,
  selectStartImage
};

export { updateFailedAiCreatorPrompt };

export function getAiCreatorSequenceStatus(userId: string, sequenceId: string) {
  return getSequenceStatus(userId, sequenceId, generation);
}

export function startNextAiCreatorScene(userId: string, parentSceneId: string, frameAssetId: string) {
  return startNextScene(userId, parentSceneId, frameAssetId, generation);
}

export function retryFailedAiCreatorScene(userId: string, sequenceId: string) {
  return retrySequenceScene(userId, sequenceId, generation);
}

export function repairAiCreatorPrompt(userId: string, sequenceId: string, input: AiCreatorPromptInput) {
  return repairPrompt(userId, sequenceId, input, runReasoning);
}

export function draftAiCreatorScenes(userId: string, projectId: string, input: AiCreatorSceneDraftInput) {
  return draftScenes(userId, projectId, input, runReasoning);
}

export function startAiCreatorVideo(userId: string, projectId: string, input: AiCreatorVideoInput) {
  return startVideo(userId, projectId, input, generation);
}
