"use client";

import { createElement } from "react";
import { CreateProjectButton } from "@/application/projects/client";
import { EmptyState as StudioEmptyState } from "@/features/studio/components/EmptyState";

export function EmptyState() {
  const button = createElement(CreateProjectButton, { label: "Create project" });
  return createElement(StudioEmptyState, { createProjectButton: button });
}
