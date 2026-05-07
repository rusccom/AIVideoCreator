import { listAiModels } from "@/features/admin/server/ai-model-service";
import { AiModelList } from "@/features/owner/components/AiModelList";
import { OwnerPageHeader } from "@/features/owner/components/OwnerPageHeader";

export const dynamic = "force-dynamic";

export default async function OwnerVideoModelsPage() {
  const models = await listAiModels();
  const videoModels = models.filter((model) => model.type === "image-to-video");
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Video generation models"
        description="Configure FAL video models, duration limits, and credit prices."
      />
      <div className="side-stack">
        <AiModelList models={videoModels} />
      </div>
    </main>
  );
}
