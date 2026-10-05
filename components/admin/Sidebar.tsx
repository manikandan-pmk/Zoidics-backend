"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  BriefcaseBusiness,
  MessageSquare,
  Quote,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    label: "Services",
    href: "/dashboard/services",
    icon: BriefcaseBusiness,
  },
  {
    label: "Testimonials",
    href: "/dashboard/testimonials",
    icon: Quote,
  },
  {
    label: "Blog",
    href: "/dashboard/blog",
    icon: FileText,
  },
  {
    label: "Client Enquiries",
    href: "/dashboard/contacts",
    icon: MessageSquare,
  },
   {
    label: "ChatBot Leads",
    href: "/dashboard/chatbot-leads",
    icon: Settings,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[248px] flex-col border-r border-black/[0.08] bg-white lg:flex font-['Sora',sans-serif]">
      {/* LOGO */}
      <div className="flex h-[80px] shrink-0 items-center border-b border-black/[0.08] px-6">
        <div className="flex flex-col justify-center">
          {/* Logo Image */}
          <img
            src="/logo.png"
            alt="Zoidics Logo"
            className="h-20 w-auto object-contain"
          />
         
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">
          Management
        </p>

        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;

            // Fixed the active path logic to match your hrefs
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex h-[44px] items-center gap-3 rounded-xl px-3 text-[13px] transition-all duration-200 ${
                  isActive
                    ? "bg-[#ffb646]/10 text-[#080808] font-bold"
                    : "text-black/60 font-medium hover:bg-black/[0.035] hover:text-[#080808]"
                }`}
              >
                {/* ACTIVE LINE */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#ffb646]" />
                )}

                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? "text-[#ff8a24]"
                      : "text-black/40 group-hover:text-black/70"
                  }`}
                />

                <span className="flex-1">{item.label}</span>

                {isActive && (
                  <ChevronRight
                    size={15}
                    strokeWidth={2.5}
                    className="text-[#ffb646]"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* BOTTOM WIDGET */}
      <div className="border-t border-black/[0.08] p-4">
        <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-3 transition-colors hover:bg-black/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#080808] text-[12px] font-bold text-[#ffb646] shadow-sm">
              Z
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-[#080808] truncate">
                Zoidics Studio
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-black/40 truncate">
                Portfolio Management
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
