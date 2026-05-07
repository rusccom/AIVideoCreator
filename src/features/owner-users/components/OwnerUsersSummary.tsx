import type { OwnerUserRow } from "../server/owner-user-service";
import { OwnerUsersTable } from "./OwnerUsersTable";

type OwnerUsersSummaryProps = {
  totalUsers: number;
  users: OwnerUserRow[];
};

export function OwnerUsersSummary({ totalUsers, users }: OwnerUsersSummaryProps) {
  return (
    <section className="settings-panel owner-users-panel">
      <div className="owner-users-total">
        <span>Registered users</span>
        <strong>{totalUsers}</strong>
      </div>
      <details className="owner-users-details">
        <summary>
          <span>User table</span>
          <strong>{users.length}</strong>
        </summary>
        <OwnerUsersTable users={users} />
      </details>
    </section>
  );
}
