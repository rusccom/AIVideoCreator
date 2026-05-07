import { OwnerPageHeader } from "@/features/owner/components/OwnerPageHeader";
import { OwnerUsersSummary } from "@/features/owner-users/components/OwnerUsersSummary";
import { getOwnerUsersOverview } from "@/features/owner-users/server/owner-user-service";

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
