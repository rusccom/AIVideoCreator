export type AspectRatioPreset = {
  id: string;
  label: string;
  value: string;
};

export const COMMON_ASPECT_RATIO_PRESETS = [
  { id: "youtube", label: "YouTube", value: "16:9" },
  { id: "reels", label: "Reels / Shorts / TikTok", value: "9:16" },
  { id: "instagram-square", label: "Instagram square", value: "1:1" },
  { id: "instagram-portrait", label: "Instagram portrait", value: "4:5" },
  { id: "classic-landscape", label: "Classic landscape", value: "4:3" }
] satisfies AspectRatioPreset[];

export function defaultAspectRatioPreset() {
  return COMMON_ASPECT_RATIO_PRESETS[0];
}
