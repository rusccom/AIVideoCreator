import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "@/styles/studio.css";
import "@/styles/forms.css";
import { getAdminUser } from "@/features/auth/server/admin-auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false
  }
};

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getAdminUser();
  if (!user) redirect("/owner/login");
  return <div className="studio-shell">{children}</div>;
}
