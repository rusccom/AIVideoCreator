import { OwnerPageHeader } from "@/application/owner/client";
import { ReasoningModelList } from "@/application/reasoning/client";
import { updateReasoningModelAction } from "@/application/reasoning/model-actions";
import { listReasoningModels } from "@/application/reasoning/server";

export const dynamic = "force-dynamic";

export default async function OwnerIntelligenceModelsPage() {
  const models = await listReasoningModels();
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Intelligence models"
        description="Choose the global reasoning model and track token usage."
      />
      <ReasoningModelList action={updateReasoningModelAction} models={models} />
    </main>
  );
}
