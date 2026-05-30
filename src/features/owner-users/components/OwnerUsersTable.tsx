import type { OwnerUserRow } from "../server/owner-user-service";
import { OwnerUserActions, type OwnerUserActionSet } from "./OwnerUserActions";

type OwnerUsersTableProps = {
  actions: OwnerUserActionSet;
  users: OwnerUserRow[];
};

export function OwnerUsersTable({ actions, users }: OwnerUsersTableProps) {
  if (!users.length) return <p className="form-note">No registered users yet.</p>;
  return (
    <div className="owner-users-table-wrap">
      <table className="owner-users-table">
        {ownerUsersHead()}
        <tbody>{users.map((user) => ownerUserRow(user, actions))}</tbody>
      </table>
    </div>
  );
}

function ownerUsersHead() {
  return <thead><tr><th>User</th><th>Status</th><th>Balance</th><th>Spent</th><th>Manage</th></tr></thead>;
}

function ownerUserRow(user: OwnerUserRow, actions: OwnerUserActionSet) {
  return (
    <tr key={user.id}>
      <td>{userLabel(user)}</td>
      <td>{user.disabled ? "blocked" : "active"}</td>
      <td>{user.creditBalance.toLocaleString()}</td>
      <td>{user.spentCredits.toLocaleString()}</td>
      <td><OwnerUserActions actions={actions} user={user} /></td>
    </tr>
  );
}

function userLabel(user: OwnerUserRow) {
  return user.name ? `${user.name} (${user.email})` : user.email;
}
