import type { FalInputContext } from "../types";
import { buildSeedance2ReferenceVideoInput } from "../seedance-2-reference-video-input";

export function buildSeedance2FastReferenceToVideoInput(context: FalInputContext) {
  return buildSeedance2ReferenceVideoInput(context);
}
