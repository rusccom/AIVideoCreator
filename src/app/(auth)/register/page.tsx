import { AuthShell } from "@/application/auth/client";
import { RegisterForm } from "@/application/auth/client";

export default function RegisterPage() {
  return (
    <AuthShell title="Create account" text="Start building linked AI video timelines.">
      <RegisterForm />
    </AuthShell>
  );
}
