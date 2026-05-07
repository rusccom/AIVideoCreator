import { listAiModels } from "@/features/admin/server/ai-model-service";
import { ImageModelList } from "@/features/image-generation/components/ImageModelList";
import { OwnerEmptyPanel } from "@/features/owner/components/OwnerEmptyPanel";
import { OwnerPageHeader } from "@/features/owner/components/OwnerPageHeader";

export const dynamic = "force-dynamic";

export default async function OwnerImageModelsPage() {
  const models = await listAiModels();
  const imageModels = models.filter((model) => model.type !== "image-to-video");
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Image generation models"
        description="Configure image model adapters when they are added to the code catalog."
      />
      {imageModels.length > 0 ? (
        <ImageModelList models={imageModels} />
      ) : (
        <OwnerEmptyPanel
          title="No image models"
          description="Image generation models are not added yet. This section is ready for that catalog."
        />
      )}
    </main>
  );
}
