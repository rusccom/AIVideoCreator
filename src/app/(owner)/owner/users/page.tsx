import { OwnerPageHeader } from "@/application/owner/client";
import { OwnerUsersSummary } from "@/application/owner-users/client";
import { getOwnerUsersOverview } from "@/application/owner-users/server";

export const dynamic = "force-dynamic";

export default async function OwnerUsersPage() {
  const overview = await getOwnerUsersOverview();
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Users"
        description="Registered service users and current credit balances."
      />
      <div className="side-stack">
        <OwnerUsersSummary totalUsers={overview.totalUsers} users={overview.users} />
      </div>
    </main>
  );
}
