import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Home, Compass, Settings, LayoutDashboard, Users } from "lucide-react";

const DashboardSidebar = () => {
  const { data: session } = useSession();

  const menuItems = [
    { href: "/dashboard", label: "Overview", icon: Home },
    { href: "/dashboard/favourites", label: "Favourites", icon: Compass },
    { href: "/dashboard/history", label: "History", icon: LayoutDashboard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-livehub-card border-r border-livehub-border h-screen sticky top-16">
      <nav className="p-6 space-y-4">
        {menuItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-livehub-hover rounded-lg transition-colors"
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export { DashboardSidebar };
