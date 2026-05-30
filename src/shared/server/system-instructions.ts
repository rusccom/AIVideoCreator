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
  },
  aiCreatorStoryboard: {
    purpose: "Plan a storyboard grid from a video idea and a consistent main character.",
    instruction: [
      "Plan a short cinematic video as an ordered storyboard.",
      "Return exactly the requested number of panels in story order.",
      "Each panel needs a short bold scene title, one vivid action line, and one camera direction.",
      "Keep the SAME main character appearance, clothing, and mood in every panel.",
      "Write all panel text in English, concrete and cinematic, with no markdown and no panel numbers.",
      "Build a continuous narrative with a clear beginning, middle, and end."
    ].join(" ")
  },
  aiCreatorPromptRepair: {
    purpose: "Rewrite a rejected AI Creator video prompt so the video model can process it.",
    instruction: [
      "Rewrite the rejected video generation prompt into a provider-safe version.",
      "Preserve the scene intent, narration language, visual continuity, aspect ratio, and duration cues.",
      "Remove or soften wording likely to trigger content filters, including geopolitical framing, political news framing, conflict cues, graphic danger, public-figure claims, and sensitive location emphasis.",
      "Keep the result concrete and cinematic, but neutral and commercial-documentary in tone.",
      "Return only the revised prompt with no markdown, no labels, and no explanation."
    ].join(" ")
  }
} as const;

export function systemInstruction(key: SystemInstructionKey) {
  return systemInstructions[key].instruction;
}

export type SystemInstructionKey = keyof typeof systemInstructions;
