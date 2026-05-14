import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "@/styles/studio.css";
import "@/styles/studio-responsive.css";
import "@/styles/forms.css";
import "@/styles/owner-models.css";
import "@/styles/owner-users.css";
import "@/styles/billing.css";
import { getAdminUser } from "@/application/auth/server";
import { OwnerShell } from "@/application/owner/client";

export const metadata: Metadata = {
  title: "Owner",
  robots: { index: false, follow: false }
};

type OwnerLayoutProps = {
  children: React.ReactNode;
};

export default async function OwnerLayout({ children }: OwnerLayoutProps) {
  const user = await getAdminUser();
  if (!user) redirect("/owner/login");
  return <OwnerShell>{children}</OwnerShell>;
}
