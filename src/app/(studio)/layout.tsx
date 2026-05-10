import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "@/styles/studio.css";
import "@/styles/editor.css";
import "@/styles/editor-photo.css";
import "@/styles/editor-progress.css";
import "@/styles/forms.css";
import "@/styles/project-modal.css";
import "@/styles/ai-creator.css";
import { getCurrentUser } from "@/features/auth/server/current-user";
import { StudioShell } from "@/features/studio/components/StudioShell";
import { getTopbarData } from "@/features/studio/server/dashboard-service";

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
