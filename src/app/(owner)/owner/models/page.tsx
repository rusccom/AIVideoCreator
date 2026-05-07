import { listAiModels } from "@/features/admin/server/ai-model-service";
import { OwnerPageHeader } from "@/features/owner/components/OwnerPageHeader";
import { OwnerSectionLink } from "@/features/owner/components/OwnerSectionLink";
import { countRegisteredUsers } from "@/features/owner-users/server/owner-user-service";
import { listReasoningModels } from "@/features/reasoning/server/reasoning-model-service";

export const dynamic = "force-dynamic";

export default async function OwnerModelsPage() {
  const models = await listAiModels();
  const reasoningModels = await listReasoningModels();
  const registeredUsers = await countRegisteredUsers();

  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Model control"
        description="Choose a model section from the owner panel."
      />
      <div className="side-stack">
        <section className="settings-panel">
          <h2>Model sections</h2>
          <OwnerSectionLink href="/owner/video-models" label="Video generation models" value={`${videoCount(models)}`} />
          <OwnerSectionLink href="/owner/image-models" label="Image generation models" value={`${imageCount(models)}`} />
          <OwnerSectionLink href="/owner/intelligence-models" label="Intelligence models" value={`${reasoningModels.length}`} />
          <OwnerSectionLink href="/owner/users" label="Registered users" value={`${registeredUsers}`} />
        </section>
      </div>
    </main>
  );
}

function videoCount(models: Awaited<ReturnType<typeof listAiModels>>) {
  return models.filter((model) => model.type === "image-to-video").length;
}

function imageCount(models: Awaited<ReturnType<typeof listAiModels>>) {
  return models.filter((model) => model.type !== "image-to-video").length;
}
