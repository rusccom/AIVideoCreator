import { OwnerSidebar } from "./OwnerSidebar";

type OwnerShellProps = {
  children: React.ReactNode;
};

export function OwnerShell({ children }: OwnerShellProps) {
  return (
    <div className="studio-shell">
      <div className="studio-layout">
        <OwnerSidebar />
        <div className="studio-main">
          {children}
        </div>
      </div>
    </div>
  );
}
