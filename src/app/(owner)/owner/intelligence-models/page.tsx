import { OwnerPageHeader } from "@/features/owner/components/OwnerPageHeader";
import { ReasoningModelList } from "@/features/reasoning/components/ReasoningModelList";
import { listReasoningModels } from "@/features/reasoning/server/reasoning-model-service";

export const dynamic = "force-dynamic";

export default async function OwnerIntelligenceModelsPage() {
  const models = await listReasoningModels();
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Intelligence models"
        description="Choose the global reasoning model and track token usage."
      />
      <ReasoningModelList models={models} />
    </main>
  );
}
