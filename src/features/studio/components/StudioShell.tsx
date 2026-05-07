"use client";

import { usePathname } from "next/navigation";
import { StudioSidebar } from "./StudioSidebar";
import { StudioTopbar } from "./StudioTopbar";

type StudioShellProps = {
  children: React.ReactNode;
  credits: number;
};

export function StudioShell({ children, credits }: StudioShellProps) {
  const editorMode = isProjectEditor(usePathname());
  return (
    <div className="studio-shell">
      <div className={layoutClass(editorMode)}>
        {editorMode ? null : <StudioSidebar />}
        <div className="studio-main">
          {editorMode ? null : <StudioTopbar credits={credits} editorMode={editorMode} />}
          <main className={contentClass(editorMode)}>{children}</main>
        </div>
      </div>
    </div>
  );
}

function isProjectEditor(pathname: string) {
  return /^\/app\/projects\/[^/]+$/.test(pathname);
}

function layoutClass(editorMode: boolean) {
  return editorMode ? "studio-layout editor-mode" : "studio-layout";
}

function contentClass(editorMode: boolean) {
  return editorMode ? "studio-content editor-mode" : "studio-content";
}
