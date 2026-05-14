import { listAiModels } from "@/application/admin/server";
import { updateAiModelAction } from "@/application/admin/model-actions";
import { AiModelList } from "@/application/owner/client";
import { OwnerPageHeader } from "@/application/owner/client";

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
        <AiModelList action={updateAiModelAction} models={videoModels} />
      </div>
    </main>
  );
}
