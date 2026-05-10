import type { EditorScene } from "../types";

export type ScenePosition = {
  scene: EditorScene;
  index: number;
  startTime: number;
  endTime: number;
};

export class PlaybackTimeline {
  readonly positions: readonly ScenePosition[];
  readonly totalDuration: number;

  constructor(scenes: readonly EditorScene[]) {
    this.positions = buildPositions(scenes);
    const last = this.positions[this.positions.length - 1];
    this.totalDuration = last ? last.endTime : 0;
  }

  get scenes(): readonly EditorScene[] {
    return this.positions.map((position) => position.scene);
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

  nextPlayable(after: ScenePosition): ScenePosition | null {
    for (let cursor = after.index + 1; cursor < this.positions.length; cursor += 1) {
      const candidate = this.positions[cursor];
      if (candidate.scene.videoUrl) return candidate;
    }
    return null;
  }
}

function buildPositions(scenes: readonly EditorScene[]): ScenePosition[] {
  let cursor = 0;
  return scenes.map((scene, index) => {
    const startTime = cursor;
    cursor += scene.durationSeconds;
    return { scene, index, startTime, endTime: cursor };
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
