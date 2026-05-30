import type { OwnerUserRow } from "../server/owner-user-service";

export type OwnerUserActionSet = {
  adjustCredits: (formData: FormData) => void | Promise<void>;
  promote: (formData: FormData) => void | Promise<void>;
  setBlocked: (formData: FormData) => void | Promise<void>;
};

type OwnerUserActionsProps = {
  actions: OwnerUserActionSet;
  user: OwnerUserRow;
};

export function OwnerUserActions({ actions, user }: OwnerUserActionsProps) {
  return (
    <div className="owner-user-actions">
      {adjustForm(actions.adjustCredits, user.id)}
      {blockForm(actions.setBlocked, user)}
      {promoteForm(actions.promote, user.id)}
    </div>
  );
}

function adjustForm(action: OwnerUserActionSet["adjustCredits"], userId: string) {
  return (
    <form action={action} className="owner-user-adjust">
      <input name="userId" type="hidden" value={userId} />
      <input aria-label="Credit amount" name="amount" placeholder="+/- credits" type="number" />
      <input aria-label="Reason" maxLength={120} name="reason" placeholder="Reason" type="text" />
      <button className="button button-secondary" type="submit">Apply</button>
    </form>
  );
}

function blockForm(action: OwnerUserActionSet["setBlocked"], user: OwnerUserRow) {
  return (
    <form action={action}>
      <input name="userId" type="hidden" value={user.id} />
      <input name="blocked" type="hidden" value={user.disabled ? "0" : "1"} />
      <button className={user.disabled ? "button button-secondary" : "button button-danger"} type="submit">
        {user.disabled ? "Unblock" : "Block"}
      </button>
    </form>
  );
}

function promoteForm(action: OwnerUserActionSet["promote"], userId: string) {
  return (
    <form action={action}>
      <input name="userId" type="hidden" value={userId} />
      <button className="button button-secondary" type="submit">Make admin</button>
    </form>
  );
}
