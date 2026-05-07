import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { OwnerLoginForm } from "@/features/owner/components/OwnerLoginForm";

export const metadata: Metadata = {
  title: "Owner access",
  robots: { index: false, follow: false }
};

export default function OwnerLoginPage() {
  return (
    <AuthShell title="Owner access" text="Private service control panel.">
      <OwnerLoginForm />
    </AuthShell>
  );
}
