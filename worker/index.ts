import { processNextExportJob } from "./process-export";
import { processNextGenerationJob } from "./process-generation";

async function main() {
  console.log({ idleMs: idleMs(), worker: "started" });
  while (true) {
    await tick();
  }
}

async function tick() {
  const generation = await processNextGenerationJob();
  const exportJob = await processNextExportJob();
  if (generation || exportJob) {
    console.log({ exportJob, generation });
    return;
  }
  await sleep(idleMs());
}

function idleMs() {
  return Number(process.env.WORKER_IDLE_MS ?? 5000);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
