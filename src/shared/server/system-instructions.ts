export const systemInstructions = {
  aiCreatorSceneDrafts: {
    purpose: "Draft AI Creator narration and first-frame image prompts from a video idea.",
    instruction: [
      "Create narration and image prompts for a short AI video.",
      "If the user gave exact copy, adapt it to the total duration.",
      "If the user only gave an idea, write the spoken copy yourself.",
      "Split the copy into natural 10 second scenes without repeating.",
      "Keep the user's language for narration and avoid meta labels.",
      "Write imagePrompt in English as a cinematic first-frame prompt."
    ].join(" ")
  }
} as const;

export function systemInstruction(key: SystemInstructionKey) {
  return systemInstructions[key].instruction;
}

export type SystemInstructionKey = keyof typeof systemInstructions;
