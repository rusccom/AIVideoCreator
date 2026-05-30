import type { OwnerUserRow } from "../server/owner-user-service";
import { OwnerUsersTable } from "./OwnerUsersTable";
import type { OwnerUserActionSet } from "./OwnerUserActions";

type OwnerUsersSummaryProps = {
  actions: OwnerUserActionSet;
  totalUsers: number;
  users: OwnerUserRow[];
};

export function OwnerUsersSummary({ actions, totalUsers, users }: OwnerUsersSummaryProps) {
  return (
    <section className="settings-panel owner-users-panel">
      <div className="owner-users-total">
        <span>Registered users</span>
        <strong>{totalUsers}</strong>
      </div>
      <details className="owner-users-details" open>
        <summary>
          <span>User table</span>
          <strong>{users.length}</strong>
        </summary>
        <OwnerUsersTable actions={actions} users={users} />
      </details>
    </section>
  );
}
