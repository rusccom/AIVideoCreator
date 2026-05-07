import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell title="Sign in" text="Open your AI studio, projects, credits, and exports.">
      <LoginForm />
    </AuthShell>
  );
}
