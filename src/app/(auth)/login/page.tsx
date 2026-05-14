import { AuthShell } from "@/application/auth/client";
import { LoginForm } from "@/application/auth/client";

export default function LoginPage() {
  return (
    <AuthShell title="Sign in" text="Open your AI studio, projects, credits, and exports.">
      <LoginForm />
    </AuthShell>
  );
}
