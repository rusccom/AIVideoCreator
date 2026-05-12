import type { EditorScene, EditorTimelineItem } from "../types";

export type ScenePosition = {
  item: EditorTimelineItem;
  scene: EditorScene;
  index: number;
  startTime: number;
  endTime: number;
};

export class PlaybackTimeline {
  readonly items: readonly EditorTimelineItem[];
  readonly scenes: readonly EditorScene[];
  readonly positions: readonly ScenePosition[];
  readonly totalDuration: number;

  constructor(items: readonly EditorTimelineItem[]) {
    this.items = items;
    this.scenes = items.map((item) => item.scene);
    this.positions = buildPositions(items);
    const last = this.positions[this.positions.length - 1];
    this.totalDuration = last ? last.endTime : 0;
  }

  positionAtTime(time: number): ScenePosition | null {
    if (this.positions.length === 0) return null;
    const clamped = clamp(time, 0, this.totalDuration);
    const found = this.positions.find((position) => clamped < position.endTime);
    return found ?? this.positions[this.positions.length - 1];
  }

  positionForScene(sceneId: string): ScenePosition | null {
    return this.positions.find((position) => position.scene.id === sceneId) ?? null;
  }

  positionForItem(itemId: string): ScenePosition | null {
    return this.positions.find((position) => position.item.id === itemId) ?? null;
  }

  nextPlayable(after: ScenePosition): ScenePosition | null {
    for (let cursor = after.index + 1; cursor < this.positions.length; cursor += 1) {
      const candidate = this.positions[cursor];
      if (candidate.scene.videoUrl) return candidate;
    }
    return null;
  }
}

function buildPositions(items: readonly EditorTimelineItem[]): ScenePosition[] {
  let cursor = 0;
  return items.map((item, index) => {
    const startTime = cursor;
    cursor += item.durationSeconds;
    return { item, scene: item.scene, index, startTime, endTime: cursor };
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
