import type { StoryboardDraftInput } from "./storyboard-draft-schema";

export type StoryboardPanel = {
  action: string;
  camera: string;
  title: string;
};

const PROMPT_LIMIT = 2000;

export function gridLayout(panelCount: number) {
  if (panelCount <= 6) return { cols: 3, label: "3x2", rows: 2 };
  if (panelCount <= 9) return { cols: 3, label: "3x3", rows: 3 };
  return { cols: 4, label: "4x3", rows: 3 };
}

export function buildGridPrompt(input: StoryboardDraftInput, panels: StoryboardPanel[]) {
  const layout = gridLayout(panels.length);
  const lines = [
    `Create a wide cinematic storyboard infographic in a clean ${layout.label} grid layout (${panels.length} panels).`,
    "Photorealistic cinematic style, warm lighting, shallow depth of field, realistic textures.",
    `Each panel: numbered ${numberRange(panels.length)} in the top-left, a bold scene title, one short action line, and the identical main character.`,
    `MAIN CHARACTER: ${input.character}.`,
    `Layout: professional film-production storyboard, thin dark borders between panels, ${input.aspectRatio ?? "16:9"} framing.`,
    ...panels.map((panel, index) => gridPanelLine(panel, index)),
    "Keep the character, lighting, and environment consistent across every panel."
  ];
  return capPrompt(lines.join("\n"));
}

export function buildShotPrompt(input: StoryboardDraftInput, panels: StoryboardPanel[]) {
  const lines = [
    `Create a ${input.durationSeconds}-second cinematic video. Strictly follow the ${panels.length}-panel storyboard in exact order (Panel 01 to Panel ${pad(panels.length)}). Do not skip, merge, or reorder.`,
    "Use the reference image as the full storyboard grid and treat each panel as one complete shot.",
    "Maintain perfect continuity: same character appearance, clothing, hair, and face in every shot, with the same world and lighting.",
    `MAIN CHARACTER: ${input.character}.`,
    "Style: photorealistic cinematic, warm light, shallow depth of field, smooth camera movement, subtle film grain.",
    "SHOT-BY-SHOT:",
    ...shotLines(input.durationSeconds, panels),
    "Add subtle ambient sound and emotional background music that builds with the story."
  ];
  return capPrompt(lines.join("\n"));
}

function shotLines(durationSeconds: number, panels: StoryboardPanel[]) {
  return panels.map((panel, index) => shotPanelLine(panel, index, panelTiming(durationSeconds, panels.length, index)));
}

function gridPanelLine(panel: StoryboardPanel, index: number) {
  return `PANEL ${pad(index + 1)} - "${panel.title}" - ${panel.action} - Camera: ${panel.camera}.`;
}

function shotPanelLine(panel: StoryboardPanel, index: number, timing: PanelTiming) {
  return `Panel ${pad(index + 1)} (${timing.start}-${timing.end}s): ${panel.action}. Camera: ${panel.camera}.`;
}

function panelTiming(durationSeconds: number, panelCount: number, index: number): PanelTiming {
  const start = Math.round((durationSeconds / panelCount) * index);
  const end = Math.round((durationSeconds / panelCount) * (index + 1));
  return { end: Math.max(end, start + 1), start };
}

function numberRange(panelCount: number) {
  return `(01-${pad(panelCount)})`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function capPrompt(prompt: string) {
  return prompt.length > PROMPT_LIMIT ? prompt.slice(0, PROMPT_LIMIT) : prompt;
}

type PanelTiming = {
  end: number;
  start: number;
};
