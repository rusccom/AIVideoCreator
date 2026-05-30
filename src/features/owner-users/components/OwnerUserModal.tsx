import type { OwnerUserRow } from "../server/owner-user-service";
import { Modal } from "@/shared/ui/Modal";
import { OwnerUserActions, type OwnerUserActionSet } from "./OwnerUserActions";

type OwnerUserModalProps = {
  actions: OwnerUserActionSet;
  onClose: () => void;
  user: OwnerUserRow;
};

export function OwnerUserModal({ actions, onClose, user }: OwnerUserModalProps) {
  return (
    <Modal onClose={onClose} subtitle={user.email} title={user.name ?? user.email}>
      <div className="owner-user-modal">
        {infoGrid(user)}
        <OwnerUserActions actions={actions} user={user} />
      </div>
    </Modal>
  );
}

function infoGrid(user: OwnerUserRow) {
  return (
    <div className="owner-user-info">
      {infoCell("Status", user.disabled ? "blocked" : "active")}
      {infoCell("Role", user.role.toLowerCase())}
      {infoCell("Balance", `${user.creditBalance.toLocaleString()} credits`)}
      {infoCell("Spent", `${user.spentCredits.toLocaleString()} credits`)}
      {infoCell("Registered", formatDate(user.createdAt))}
    </div>
  );
}

function infoCell(label: string, value: string) {
  return (
    <div className="owner-user-info-cell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
