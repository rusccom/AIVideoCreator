import type { Metadata } from "next";
import "@/styles/forms.css";

export const metadata: Metadata = {
  title: "Account",
  robots: {
    index: false,
    follow: false
  }
};

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <div className="auth-shell">{children}</div>;
}
