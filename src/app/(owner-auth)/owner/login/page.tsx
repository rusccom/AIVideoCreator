import type { Metadata } from "next";
import { AuthShell } from "@/application/auth/client";
import { OwnerLoginForm } from "@/application/owner/client";

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
