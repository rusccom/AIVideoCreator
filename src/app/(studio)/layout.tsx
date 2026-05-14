import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "@/styles/studio.css";
import "@/styles/studio-responsive.css";
import "@/styles/project-card-menu.css";
import "@/styles/editor.css";
import "@/styles/editor-preview-base.css";
import "@/styles/editor-timeline-base.css";
import "@/styles/editor-photo-tools.css";
import "@/styles/editor-timeline.css";
import "@/styles/editor-photo.css";
import "@/styles/editor-progress.css";
import "@/styles/editor-download.css";
import "@/styles/photo-library.css";
import "@/styles/forms.css";
import "@/styles/studio-wizard.css";
import "@/styles/project-modal.css";
import "@/styles/ai-creator.css";
import "@/styles/ai-creator-responsive.css";
import "@/styles/billing.css";
import { getCurrentUser } from "@/application/auth/server";
import { StudioShell } from "@/application/studio/client";
import { getTopbarData } from "@/application/studio/server";

export const metadata: Metadata = {
  title: "Studio",
  robots: {
    index: false,
    follow: false
  }
};

type StudioLayoutProps = {
  children: React.ReactNode;
};

export default async function StudioLayout({ children }: StudioLayoutProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const topbar = await getTopbarData(user.id);
  return <StudioShell credits={topbar.credits}>{children}</StudioShell>;
}
