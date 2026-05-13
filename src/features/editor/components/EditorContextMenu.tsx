import type { ReactNode } from "react";

export type EditorContextMenuItem = {
  danger?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  id: string;
  label: string;
  onSelect: () => void;
};

type EditorContextMenuProps = {
  items: EditorContextMenuItem[];
  x: number;
  y: number;
};

export function EditorContextMenu(props: EditorContextMenuProps) {
  return (
    <div
      className="editor-context-menu"
      role="menu"
      style={{ left: props.x, top: props.y }}
    >
      {props.items.map((item) => (
        <button
          className={item.danger ? "danger" : undefined}
          disabled={item.disabled}
          key={item.id}
          onClick={item.onSelect}
          role="menuitem"
          type="button"
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
