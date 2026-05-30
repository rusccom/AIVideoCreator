"use client";

import { useMemo, useState } from "react";
import type { OwnerUserRow } from "../server/owner-user-service";
import type { OwnerUserActionSet } from "./OwnerUserActions";
import { OwnerUserModal } from "./OwnerUserModal";
import { OwnerUsersTable } from "./OwnerUsersTable";

type OwnerUsersManagerProps = {
  actions: OwnerUserActionSet;
  totalUsers: number;
  users: OwnerUserRow[];
};

export function OwnerUsersManager({ actions, totalUsers, users }: OwnerUsersManagerProps) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const filtered = useMemo(() => filterUsers(users, query), [users, query]);
  const open = users.find((user) => user.id === openId);
  return (
    <section className="settings-panel owner-users-panel">
      {toolbar(query, setQuery, totalUsers, filtered.length)}
      <OwnerUsersTable onOpen={setOpenId} users={filtered} />
      {open ? <OwnerUserModal actions={actions} onClose={() => setOpenId(null)} user={open} /> : null}
    </section>
  );
}

function toolbar(query: string, setQuery: (value: string) => void, total: number, shown: number) {
  return (
    <div className="owner-users-toolbar">
      <input
        className="owner-users-search"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by email or name"
        type="search"
        value={query}
      />
      <span className="owner-users-count">{shown} / {total}</span>
    </div>
  );
}

function filterUsers(users: OwnerUserRow[], query: string) {
  const text = query.trim().toLowerCase();
  if (!text) return users;
  return users.filter((user) => matchesQuery(user, text));
}

function matchesQuery(user: OwnerUserRow, text: string) {
  return user.email.toLowerCase().includes(text) || (user.name ?? "").toLowerCase().includes(text);
}
