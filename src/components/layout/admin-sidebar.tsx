import React from "react";
import Link from "next/link";
import { Users, Zap, Flag } from "lucide-react";

const AdminSidebar = () => {
  const menuItems = [
    { href: "/admin", label: "Users", icon: Users },
    { href: "/admin/streams", label: "Streams", icon: Zap },
    { href: "/admin/reports", label: "Reports", icon: Flag },
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

export { AdminSidebar };
