import type { OwnerUserRow } from "../server/owner-user-service";

type OwnerUsersTableProps = {
  users: OwnerUserRow[];
};

export function OwnerUsersTable({ users }: OwnerUsersTableProps) {
  if (!users.length) {
    return <p className="form-note">No registered users yet.</p>;
  }
  return (
    <div className="owner-users-table-wrap">
      <table className="owner-users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Registered</th>
            <th>Credits</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name ? `${user.name} (${user.email})` : user.email}</td>
              <td>{formatDate(user.createdAt)}</td>
              <td>{user.creditBalance.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
