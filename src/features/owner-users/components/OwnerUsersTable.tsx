import type { OwnerUserRow } from "../server/owner-user-service";

type OwnerUsersTableProps = {
  onOpen: (id: string) => void;
  users: OwnerUserRow[];
};

export function OwnerUsersTable({ onOpen, users }: OwnerUsersTableProps) {
  if (!users.length) return <p className="form-note">No users match.</p>;
  return (
    <div className="owner-users-table-wrap">
      <table className="owner-users-table">
        {ownerUsersHead()}
        <tbody>{users.map((user) => ownerUserRow(user, onOpen))}</tbody>
      </table>
    </div>
  );
}

function ownerUsersHead() {
  return <thead><tr><th>User</th><th>Status</th><th>Balance</th><th>Spent</th></tr></thead>;
}

function ownerUserRow(user: OwnerUserRow, onOpen: (id: string) => void) {
  return (
    <tr className="owner-users-row" key={user.id} onClick={() => onOpen(user.id)}>
      <td>{userLabel(user)}</td>
      <td>{user.disabled ? "blocked" : "active"}</td>
      <td>{user.creditBalance.toLocaleString()}</td>
      <td>{user.spentCredits.toLocaleString()}</td>
    </tr>
  );
}

function userLabel(user: OwnerUserRow) {
  return user.name ? `${user.name} (${user.email})` : user.email;
}
