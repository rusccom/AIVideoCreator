import { listAiModels } from "@/application/admin/server";
import { updateAiModelAction } from "@/application/admin/model-actions";
import { AiModelList } from "@/application/owner/client";
import { OwnerPageHeader } from "@/application/owner/client";
import { getServiceSettings } from "@/application/settings/server";

export const dynamic = "force-dynamic";

export default async function OwnerVideoModelsPage() {
  const [models, settings] = await Promise.all([listAiModels(), getServiceSettings()]);
  const videoModels = models.filter((model) => model.type === "image-to-video");
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Video generation models"
        description="Configure FAL video models, duration limits, credit prices, and margins."
      />
      <div className="side-stack">
        <AiModelList action={updateAiModelAction} creditsPerUsd={settings.creditsPerUsd} models={videoModels} />
      </div>
    </main>
  );
}
