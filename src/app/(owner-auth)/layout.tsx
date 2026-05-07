import type { Metadata } from "next";
import "@/styles/forms.css";

export const metadata: Metadata = {
  title: "Owner",
  robots: { index: false, follow: false }
};

type OwnerAuthLayoutProps = {
  children: React.ReactNode;
};

export default function OwnerAuthLayout({ children }: OwnerAuthLayoutProps) {
  return <div className="auth-shell">{children}</div>;
}
