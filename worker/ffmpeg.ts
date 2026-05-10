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

function ffmpegError(code: number | null, chunks: Buffer[]) {
  const output = Buffer.concat(chunks).toString("utf8").trim();
  return new Error(output || `ffmpeg exited with ${code}`);
}
