import { AuthShell } from "@/application/auth/client";
import { RegisterForm } from "@/application/auth/client";

export default function RegisterPage() {
  return (
    <AuthShell title="Create account" text="Start building connected AI scene timelines.">
      <RegisterForm />
    </AuthShell>
  );
}
