import { listAiModels } from "@/application/admin/server";
import { OwnerPageHeader } from "@/application/owner/client";
import { OwnerSectionLink } from "@/application/owner/client";
import { countRegisteredUsers } from "@/application/owner-users/server";
import { listReasoningModels } from "@/application/reasoning/server";

export const dynamic = "force-dynamic";

export default async function OwnerModelsPage() {
  const models = await listAiModels();
  const reasoningModels = await listReasoningModels();
  const registeredUsers = await countRegisteredUsers();

  return (
    <main className="studio-content">
      <OwnerPageHeader title="Model control" description="Choose a model section from the owner panel." />
      <div className="side-stack">
        {modelSections(models, reasoningModels.length, registeredUsers)}
      </div>
    </main>
  );
}

function modelSections(models: Awaited<ReturnType<typeof listAiModels>>, reasoningCount: number, registeredUsers: number) {
  return <section className="settings-panel"><h2>Model sections</h2><OwnerSectionLink href="/owner/video-models" label="Video generation models" value={`${videoCount(models)}`} /><OwnerSectionLink href="/owner/image-models" label="Image generation models" value={`${imageCount(models)}`} /><OwnerSectionLink href="/owner/intelligence-models" label="Intelligence models" value={`${reasoningCount}`} /><OwnerSectionLink href="/owner/billing" label="Billing settings" value="rate" /><OwnerSectionLink href="/owner/users" label="Registered users" value={`${registeredUsers}`} /></section>;
}

function videoCount(models: Awaited<ReturnType<typeof listAiModels>>) {
  return models.filter((model) => model.type === "image-to-video").length;
}

function imageCount(models: Awaited<ReturnType<typeof listAiModels>>) {
  return models.filter((model) => model.type !== "image-to-video").length;
}
