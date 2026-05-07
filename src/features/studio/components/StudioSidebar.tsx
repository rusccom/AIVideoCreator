import Link from "next/link";
import { CreditCard, FolderKanban, LayoutDashboard, Settings } from "lucide-react";

const items = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/projects", label: "Projects", icon: FolderKanban },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings }
];

export function StudioSidebar() {
  return (
    <aside className="studio-sidebar">
      <Link className="brand-mark" href="/app">
        <span className="brand-symbol" />
        <span>AI Studio</span>
      </Link>
      <nav aria-label="Studio navigation">
        {items.map((item) => (
          <Link className="studio-nav-item" href={item.href} key={item.href}>
            <item.icon size={17} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
