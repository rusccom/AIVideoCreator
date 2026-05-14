import { listAiModels } from "@/application/admin/server";
import { updateImageModelAction } from "@/application/image-generation/model-actions";
import { ImageModelList } from "@/application/image-generation/client-components";
import { OwnerEmptyPanel } from "@/application/owner/client";
import { OwnerPageHeader } from "@/application/owner/client";

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
        <ImageModelList action={updateImageModelAction} models={imageModels} />
      ) : (
        <OwnerEmptyPanel
          title="No image models"
          description="Image generation models are not added yet. This section is ready for that catalog."
        />
      )}
    </main>
  );
}
