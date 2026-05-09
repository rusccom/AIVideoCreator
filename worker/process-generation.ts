import { processNextFrameExtractJob } from "./process-frame-extract";
import { processNextImageGenerationJob } from "./process-image-generation";

export async function processNextGenerationJob() {
  return await processNextImageGenerationJob() ?? processNextFrameExtractJob();
}
