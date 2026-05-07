import { AuthShell } from "@/features/auth/components/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell title="Create account" text="Start building linked AI video timelines.">
      <RegisterForm />
    </AuthShell>
  );
}
