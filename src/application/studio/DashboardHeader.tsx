"use client";

import { createElement } from "react";
import { CreateProjectButton } from "@/application/projects/client";
import { DashboardHeader as StudioDashboardHeader } from "@/features/studio/components/DashboardHeader";

export function DashboardHeader() {
  const button = createElement(CreateProjectButton, { label: "Create new project" });
  return createElement(StudioDashboardHeader, { createProjectButton: button });
}
