"use client";

export type OwnerEntityItem = {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
};

type OwnerEntityListProps = {
  emptyLabel?: string;
  items: OwnerEntityItem[];
  onOpen: (id: string) => void;
};

export function OwnerEntityList({ emptyLabel, items, onOpen }: OwnerEntityListProps) {
  if (!items.length) return <p className="form-note">{emptyLabel ?? "Nothing here yet."}</p>;
  return (
    <div className="owner-entity-list">
      {items.map((item) => (
        <button className="owner-entity-row" key={item.id} onClick={() => onOpen(item.id)} type="button">
          <span className="owner-entity-name">
            <strong>{item.title}</strong>
            {item.subtitle ? <small>{item.subtitle}</small> : null}
          </span>
          {item.status ? <span className="badge">{item.status}</span> : null}
          <span className="owner-entity-open">Configure</span>
        </button>
      ))}
    </div>
  );
}
