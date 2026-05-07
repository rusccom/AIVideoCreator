import { AdminDashboard } from "@/features/admin/components/AdminDashboard";
import { listAiModels } from "@/features/admin/server/ai-model-service";
import { getAdminMetrics } from "@/features/admin/server/admin-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const metrics = await getAdminMetrics();
  const models = await listAiModels();
  return <AdminDashboard metrics={metrics} models={models} />;
}
