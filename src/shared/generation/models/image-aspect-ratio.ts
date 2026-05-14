import type { FalImageInput, SupportedModelDefinition } from "./types";

const IMAGE_SIZE_BY_RATIO: Record<string, string> = {
  "1:1": "square",
  "3:4": "portrait_4_3",
  "4:3": "landscape_4_3",
  "9:16": "portrait_16_9",
  "16:9": "landscape_16_9"
};

const RATIO_BY_IMAGE_SIZE: Record<string, string> = {
  square_hd: "1:1",
  square: "1:1",
  portrait_4_3: "3:4",
  landscape_4_3: "4:3",
  portrait_16_9: "9:16",
  landscape_16_9: "16:9"
};

export function normalizeImageAspectRatio(
  input: FalImageInput,
  model: SupportedModelDefinition
): FalImageInput {
  const aspectRatio = normalizedAspectRatio(input.aspectRatio, model.defaultAspectRatio);
  if (model.imageDefaults?.aspectRatioMode === "image_size") {
    return { ...input, aspectRatio, imageSize: input.imageSize ?? imageSize(aspectRatio, model) };
  }
  return { ...input, aspectRatio };
}

export function falImageAspectInput(input: FalImageInput) {
  if (input.imageSize) return { image_size: input.imageSize };
  return { aspect_ratio: input.aspectRatio ?? "auto" };
}

export function falReferenceImageInput(input: FalImageInput) {
  if (!input.referenceImageUrls?.length) return {};
  return { image_urls: input.referenceImageUrls };
}

function normalizedAspectRatio(value: string | undefined, fallback: string) {
  const ratio = value || fallback;
  return RATIO_BY_IMAGE_SIZE[ratio] ?? ratio;
}

function imageSize(aspectRatio: string, model: SupportedModelDefinition) {
  const fallback = model.imageDefaults?.defaultImageSize ?? "square";
  if (!aspectRatio || aspectRatio === "auto") return fallback;
  return IMAGE_SIZE_BY_RATIO[aspectRatio] ?? customImageSize(aspectRatio) ?? fallback;
}

function customImageSize(aspectRatio: string) {
  const ratio = parseRatio(aspectRatio);
  if (!ratio) return null;
  const scale = Math.sqrt(1_048_576 / (ratio.width * ratio.height));
  return {
    width: imageDimension(ratio.width * scale),
    height: imageDimension(ratio.height * scale)
  };
}

function parseRatio(aspectRatio: string) {
  const [width, height] = aspectRatio.split(":").map(Number);
  if (!width || !height) return null;
  return { width, height };
}

function imageDimension(value: number) {
  return Math.min(4000, Math.max(16, Math.round(value / 16) * 16));
}
