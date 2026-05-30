import Link from "next/link";
import { brand } from "@/shared/brand";

type AuthShellProps = {
  title: string;
  text: string;
  children: React.ReactNode;
};

export function AuthShell({ title, text, children }: AuthShellProps) {
  return (
    <main className="auth-card">
      <Link className="brand-mark" href="/">
        <span className="brand-symbol" />
        <span>{brand.name}</span>
      </Link>
      <h1>{title}</h1>
      <p>{text}</p>
      {children}
    </main>
  );
}
