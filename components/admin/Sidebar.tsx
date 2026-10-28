
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  BriefcaseBusiness,
  MessageSquare,
  Quote,
  FileText,
  Settings,
  ChevronRight,
  UsersRound,
  X,
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
    label: "Lead Management",
    href: "/dashboard/leads",
    icon: UsersRound,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      setMobileOpen((current) => !current);
    };

    const handleClose = () => {
      setMobileOpen(false);
    };

    window.addEventListener(
      "zoidics:toggle-sidebar",
      handleToggle
    );

    window.addEventListener(
      "zoidics:close-sidebar",
      handleClose
    );

    return () => {
      window.removeEventListener(
        "zoidics:toggle-sidebar",
        handleToggle
      );

      window.removeEventListener(
        "zoidics:close-sidebar",
        handleClose
      );
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      {/* LOGO */}
      <div className="flex h-[80px] shrink-0 items-center justify-between border-b border-black/[0.08] px-6">
        <div className="flex min-w-0 flex-col justify-center">
          {/* Logo Image */}
          <img
            src="/logo.png"
            alt="Zoidics Logo"
            className="h-20 max-w-full w-auto object-contain"
          />
        </div>

        {/* MOBILE CLOSE BUTTON */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black/60 transition hover:bg-black/[0.05] lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">
          Management
        </p>

        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;

            // Existing active path logic
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all duration-200 ${
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

                <span className="min-w-0 flex-1">
                  {item.label}
                </span>

                {isActive && (
                  <ChevronRight
                    size={15}
                    strokeWidth={2.5}
                    className="shrink-0 text-[#ffb646]"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* BOTTOM WIDGET */}
      <div className="shrink-0 border-t border-black/[0.08] p-4">
        <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-3 transition-colors hover:bg-black/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#080808] text-[12px] font-bold text-[#ffb646] shadow-sm">
              Z
            </div>

            
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[248px] flex-col border-r border-black/[0.08] bg-white font-['Sora',sans-serif] lg:flex">
        {sidebarContent}
      </aside>

      {/* MOBILE AND TABLET SIDEBAR */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* BACKDROP */}
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[2px]"
          />

          {/* SLIDE-IN DRAWER */}
          <aside className="absolute inset-y-0 left-0 flex h-full w-[min(300px,85vw)] flex-col border-r border-black/[0.08] bg-white shadow-2xl font-['Sora',sans-serif]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
