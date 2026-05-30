"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { generateProjectImageAssets } from "@/shared/client/project-image-client";
import type { EditorIntegrations, StartedCreatorVideo } from "../editor-integrations";
import type { EditorImageModel, EditorVideoModel } from "../types";

export const STORYBOARD_PANEL_OPTIONS = [6, 9, 12];
const MIN_DURATION = 6;
const MAX_DURATION = 15;
const PREFERRED_VIDEO_IDS = ["seedance-2-reference-to-video", "seedance-2-fast-reference-to-video"];
const PREFERRED_IMAGE_IDS = ["gpt-image-2"];

export type StoryboardPhase = "idle" | "planning" | "rendering" | "ready" | "submitting";

export type StoryboardFormState = {
  character: string;
  durationSeconds: number;
  idea: string;
  imageModelId: string;
  panelCount: number;
  resolution: string;
  videoModelId: string;
};

export type StoryboardGrid = {
  assetId: string;
  shotPrompt: string;
  url?: string;
};

export type StoryboardCreatorOptions = {
  defaultIdea: string;
  imageModels: EditorImageModel[];
  integrations: EditorIntegrations;
  onStarted: (video: StartedCreatorVideo) => void;
  projectAspectRatio: string;
  projectId: string;
  videoModels: EditorVideoModel[];
};

export function useStoryboardCreator(options: StoryboardCreatorOptions) {
  const [form, setForm] = useState(() => initialForm(options));
  const [grid, setGrid] = useState<StoryboardGrid | null>(null);
  const [phase, setPhase] = useState<StoryboardPhase>("idle");
  const [error, setError] = useState("");
  const videoModel = selectModel(options.videoModels, form.videoModelId);
  const context = { form, grid, options, setError, setGrid, setPhase, videoModel };
  return {
    cost: videoCost(videoModel, form),
    error,
    form,
    grid,
    imageModel: selectModel(options.imageModels, form.imageModelId),
    phase,
    plan: () => runPlan(context),
    setField: setField(setForm),
    changeVideoModel: (id: string) => setForm((current) => videoModelState(current, selectModel(options.videoModels, id))),
    submit: () => runSubmit(context),
    videoModel
  };
}

function setField(setForm: SetForm) {
  return <K extends keyof StoryboardFormState>(key: K, value: StoryboardFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
}

async function runPlan(context: ActionContext) {
  context.setError("");
  context.setGrid(null);
  context.setPhase("planning");
  try {
    const draft = await context.options.integrations.draftStoryboard(context.options.projectId, planRequest(context));
    context.setPhase("rendering");
    const asset = await renderGrid(context, draft.gridPrompt);
    context.setGrid({ assetId: asset.id, shotPrompt: draft.shotPrompt, url: asset.url });
    context.setPhase("ready");
  } catch (error) {
    context.setError(errorMessage(error, "Storyboard could not be generated."));
    context.setPhase("idle");
  }
}

async function renderGrid(context: ActionContext, prompt: string) {
  const assets = await generateProjectImageAssets(context.options.projectId, gridImageRequest(context, prompt));
  const asset = assets[0];
  if (!asset) throw new Error("Storyboard grid image could not be created.");
  return asset;
}

async function runSubmit(context: ActionContext) {
  if (!context.grid || !context.videoModel) return context.setError("Generate the storyboard grid first.");
  context.setPhase("submitting");
  context.setError("");
  try {
    context.options.onStarted(await context.options.integrations.startClipGeneration(clipInput(context, context.grid, context.videoModel)));
  } catch (error) {
    context.setError(errorMessage(error, "Video generation could not start."));
    context.setPhase("ready");
  }
}

function planRequest(context: ActionContext) {
  return {
    aspectRatio: context.options.projectAspectRatio,
    character: context.form.character,
    durationSeconds: context.form.durationSeconds,
    idea: context.form.idea,
    panelCount: context.form.panelCount
  };
}

function gridImageRequest(context: ActionContext, prompt: string) {
  return {
    aspectRatio: context.options.projectAspectRatio,
    modelId: context.form.imageModelId,
    numImages: 1,
    prompt
  };
}

function clipInput(context: ActionContext, grid: StoryboardGrid, model: EditorVideoModel) {
  return {
    assetId: grid.assetId,
    aspectRatio: videoAspectRatio(model, context.options.projectAspectRatio),
    duration: context.form.durationSeconds,
    modelId: context.form.videoModelId,
    projectId: context.options.projectId,
    prompt: grid.shotPrompt,
    resolution: context.form.resolution
  };
}

function initialForm(options: StoryboardCreatorOptions): StoryboardFormState {
  const videoModel = pickModel(options.videoModels, PREFERRED_VIDEO_IDS);
  const imageModel = pickModel(options.imageModels, PREFERRED_IMAGE_IDS);
  return {
    character: "",
    durationSeconds: defaultDuration(videoModel),
    idea: options.defaultIdea,
    imageModelId: imageModel?.id ?? "",
    panelCount: 9,
    resolution: videoModel?.defaultResolution ?? "720p",
    videoModelId: videoModel?.id ?? ""
  };
}

function videoModelState(current: StoryboardFormState, model?: EditorVideoModel): StoryboardFormState {
  return {
    ...current,
    durationSeconds: clampDuration(current.durationSeconds, model),
    resolution: model?.defaultResolution ?? current.resolution,
    videoModelId: model?.id ?? current.videoModelId
  };
}

function pickModel<T extends { id: string }>(models: T[], preferred: string[]) {
  return models.find((model) => preferred.includes(model.id)) ?? models[0];
}

function selectModel(models: EditorVideoModel[], modelId: string): EditorVideoModel | undefined;
function selectModel(models: EditorImageModel[], modelId: string): EditorImageModel | undefined;
function selectModel<T extends { id: string }>(models: T[], modelId: string) {
  return models.find((model) => model.id === modelId) ?? models[0];
}

function defaultDuration(model?: EditorVideoModel) {
  return Math.max(MIN_DURATION, Math.min(MAX_DURATION, model?.maxDurationSeconds ?? MAX_DURATION));
}

function clampDuration(value: number, model?: EditorVideoModel) {
  const max = Math.min(MAX_DURATION, model?.maxDurationSeconds ?? MAX_DURATION);
  return Math.max(MIN_DURATION, Math.min(value, max));
}

function videoCost(model: EditorVideoModel | undefined, form: StoryboardFormState) {
  if (!model) return null;
  const price = model.pricePerSecondByResolution[form.resolution] ?? 0;
  return Math.ceil(form.durationSeconds * price);
}

function videoAspectRatio(model: EditorVideoModel, aspectRatio: string) {
  if (model.supportedAspectRatios.includes(aspectRatio)) return aspectRatio;
  return model.supportedAspectRatios.includes("auto") ? "auto" : model.defaultAspectRatio;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const STORYBOARD_DURATION_BOUNDS = { max: MAX_DURATION, min: MIN_DURATION };

type SetForm = Dispatch<SetStateAction<StoryboardFormState>>;
type ActionContext = {
  form: StoryboardFormState;
  grid: StoryboardGrid | null;
  options: StoryboardCreatorOptions;
  setError: (value: string) => void;
  setGrid: (value: StoryboardGrid | null) => void;
  setPhase: (value: StoryboardPhase) => void;
  videoModel?: EditorVideoModel;
};
