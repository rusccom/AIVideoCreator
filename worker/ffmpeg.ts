import { spawn } from "node:child_process";

export async function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn("ffmpeg", args, { stdio: "inherit" });
    process.on("close", (code) => {
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`));
    });
  });
}
