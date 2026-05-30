import { listAiModels } from "@/application/admin/server";
import { updateImageModelAction } from "@/application/image-generation/model-actions";
import { ImageModelListModal } from "@/application/image-generation/client-components";
import { OwnerPageHeader } from "@/application/owner/client";

export const dynamic = "force-dynamic";

export default async function OwnerImageModelsPage() {
  const models = await listAiModels();
  const imageModels = models.filter((model) => model.type !== "image-to-video");
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Image generation models"
        description="Open a model to configure inputs, defaults, and availability."
      />
      <div className="side-stack">
        <ImageModelListModal
          action={updateImageModelAction}
          emptyLabel="Image generation models are not added yet."
          models={imageModels}
        />
      </div>
    </main>
  );
}
