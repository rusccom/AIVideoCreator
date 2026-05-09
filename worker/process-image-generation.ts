import { prisma } from "../src/shared/server/prisma";
import { refreshGenerationJobForUser } from "../src/features/generation/server/job-service";

export async function processNextImageGenerationJob() {
  const job = await nextImageJob();
  if (!job) return null;
  const refreshed = await refreshGenerationJobForUser(job.userId, job.id);
  if (refreshed.status === "GENERATING") return null;
  return { jobId: refreshed.id, status: refreshed.status };
}

function nextImageJob() {
  return prisma.generationJob.findFirst({
    where: {
      status: "GENERATING",
      type: "IMAGE_GENERATION",
      providerRequestId: { not: null }
    },
    orderBy: { startedAt: "asc" }
  });
}
