import { AdminDashboard } from "@/application/admin/client";
import { listAiModels } from "@/application/admin/server";
import { getAdminMetrics } from "@/application/admin/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const metrics = await getAdminMetrics();
  const models = await listAiModels();
  return <AdminDashboard metrics={metrics} models={models} />;
}
