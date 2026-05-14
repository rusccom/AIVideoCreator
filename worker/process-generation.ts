import { processNextFrameExtractJob } from "./process-frame-extract";
import { processNextImageGenerationJob } from "./process-image-generation";
import { processNextVideoGenerationJob } from "./process-video-generation";

export async function processNextGenerationJob() {
  return await processNextVideoGenerationJob() ?? await processNextImageGenerationJob() ?? processNextFrameExtractJob();
}
