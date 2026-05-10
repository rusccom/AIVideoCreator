import { spawn } from "node:child_process";

export async function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], { stdio: "pipe" });
    const chunks: Buffer[] = [];
    process.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.on("close", (code) => {
      code === 0 ? resolve() : reject(ffmpegError(code, chunks));
    });
  });
}

export async function probeHasAudioStream(path: string) {
  return new Promise<boolean>((resolve) => {
    const proc = spawn("ffprobe", [
      "-v", "error", "-select_streams", "a:0",
      "-show_entries", "stream=codec_type", "-of", "csv=p=0", path
    ], { stdio: "pipe" });
    const chunks: Buffer[] = [];
    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.on("close", (code) => resolve(code === 0 && Buffer.concat(chunks).toString().trim() === "audio"));
    proc.on("error", () => resolve(false));
  });
}

function ffmpegError(code: number | null, chunks: Buffer[]) {
  const output = Buffer.concat(chunks).toString("utf8").trim();
  return new Error(output || `ffmpeg exited with ${code}`);
}
