import { OwnerPageHeader } from "@/application/owner/client";
import { OwnerUsersManager } from "@/application/owner-users/client";
import { getOwnerUsersOverview } from "@/application/owner-users/server";
import {
  adjustUserCreditsAction,
  promoteUserToAdminAction,
  setUserBlockedAction
} from "@/application/owner-users/user-actions";

export const dynamic = "force-dynamic";

const userActions = {
  adjustCredits: adjustUserCreditsAction,
  promote: promoteUserToAdminAction,
  setBlocked: setUserBlockedAction
};

export default async function OwnerUsersPage() {
  const overview = await getOwnerUsersOverview();
  return (
    <main className="studio-content">
      <OwnerPageHeader
        title="Users"
        description="Manage registered users, credit balances, and account access."
      />
      <div className="side-stack">
        <OwnerUsersManager actions={userActions} totalUsers={overview.totalUsers} users={overview.users} />
      </div>
    </main>
  );
}
