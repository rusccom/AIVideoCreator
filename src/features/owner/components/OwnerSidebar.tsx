"use client";

import Link from "next/link";
import { BrainCircuit, CreditCard, Images, LayoutDashboard, Users, Video } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/owner/models", label: "Overview", icon: LayoutDashboard },
  { href: "/owner/video-models", label: "Video models", icon: Video },
  { href: "/owner/image-models", label: "Image models", icon: Images },
  { href: "/owner/intelligence-models", label: "Intelligence", icon: BrainCircuit },
  { href: "/owner/billing", label: "Billing", icon: CreditCard },
  { href: "/owner/users", label: "Users", icon: Users }
];

export function OwnerSidebar() {
  const pathname = usePathname();
  return (
    <aside className="studio-sidebar">
      <Link className="brand-mark" href="/owner/models">
        <span className="brand-symbol" />
        <span>Owner Panel</span>
      </Link>
      <nav aria-label="Owner model navigation">
        {items.map((item) => (
          <Link className={navClass(pathname, item.href)} href={item.href} key={item.href}>
            <item.icon size={17} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function navClass(pathname: string, href: string) {
  return pathname === href ? "studio-nav-item active" : "studio-nav-item";
}
