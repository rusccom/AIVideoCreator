"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type RefObject,
  type SetStateAction
} from "react";

const DEFAULT_RATIO = 16 / 9;
const EMPTY_SIZE = { height: 0, width: 0 };

type PreviewFit = {
  screenStyle: CSSProperties;
  stageRef: RefObject<HTMLDivElement | null>;
};

type PreviewSize = {
  height: number;
  width: number;
};

type SetPreviewSize = Dispatch<SetStateAction<PreviewSize>>;

export function usePreviewFit(aspectRatio: string): PreviewFit {
  const stageRef = useRef<HTMLDivElement>(null);
  const ratio = parseAspectRatio(aspectRatio);
  const [size, setSize] = useState<PreviewSize>(EMPTY_SIZE);
  const screenStyle = useMemo(() => sizeStyle(size, ratio), [size, ratio]);
  useEffect(() => observeStage(stageRef.current, ratio, setSize), [ratio]);
  return { screenStyle, stageRef };
}

function observeStage(stage: HTMLDivElement | null, ratio: number, setSize: SetPreviewSize) {
  if (!stage) return;
  const update = () => setSize((current) => nextSize(current, stage, ratio));
  update();
  const observer = new ResizeObserver(update);
  observer.observe(stage);
  return () => observer.disconnect();
}

function nextSize(current: PreviewSize, stage: HTMLDivElement, ratio: number) {
  const fitted = fitSize(stage.clientWidth, stage.clientHeight, ratio);
  return sameSize(current, fitted) ? current : fitted;
}

function fitSize(maxWidth: number, maxHeight: number, ratio: number): PreviewSize {
  if (maxWidth <= 0 || maxHeight <= 0) return EMPTY_SIZE;
  const widthFromHeight = maxHeight * ratio;
  if (widthFromHeight <= maxWidth) return roundedSize(widthFromHeight, maxHeight);
  return roundedSize(maxWidth, maxWidth / ratio);
}

function roundedSize(width: number, height: number): PreviewSize {
  return {
    height: Math.max(1, Math.floor(height)),
    width: Math.max(1, Math.floor(width))
  };
}

function sizeStyle(size: PreviewSize, ratio: number): CSSProperties {
  if (!size.width || !size.height) return { aspectRatio: cssRatio(ratio) };
  return {
    aspectRatio: cssRatio(ratio),
    height: size.height,
    width: size.width
  };
}

function parseAspectRatio(aspectRatio: string) {
  const [width, height] = aspectRatio.split(":").map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return DEFAULT_RATIO;
  return width > 0 && height > 0 ? width / height : DEFAULT_RATIO;
}

function cssRatio(ratio: number) {
  return `${ratio} / 1`;
}

function sameSize(first: PreviewSize, second: PreviewSize) {
  return first.width === second.width && first.height === second.height;
}
