import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

export async function createJobWorkspace(jobId: string) {
  return mkdtemp(join(tmpdir(), `aivs-${jobId}-`));
}

export async function removeJobWorkspace(path: string) {
  await rm(path, { force: true, recursive: true });
}
