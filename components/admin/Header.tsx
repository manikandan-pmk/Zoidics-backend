"use client";

import {
  Bell,
  Search,
  ChevronDown,
  Menu,
  LogOut,
  Settings,
  Loader2,
} from "lucide-react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Header() {
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

 const handleLogout = async () => {
  if (loggingOut) return;

  try {
    setLoggingOut(true);
    setProfileOpen(false);

    const response = await axios.post(
      "/api/auth/logout",
      {},
      {
        withCredentials: true,
      }
    );

    const data = response.data;

    if (!data?.success) {
      throw new Error(data?.message || "Logout failed");
    }

    // JWT cookie is cleared by the server.
    router.replace("/");
    router.refresh();
  } catch (error) {
    console.error("Logout error:", error);

    if (axios.isAxiosError(error)) {
      console.error(
        "Logout API error:",
        error.response?.data?.message || error.message
      );
    }

    setLoggingOut(false);
  }
};

  return (
    <header className="sticky top-0 z-40 flex h-[80px] items-center justify-between border-b border-black/[0.08] bg-white/90 px-5 backdrop-blur-xl md:px-8 font-['Sora',sans-serif]">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        {/* MOBILE MENU */}
        <button
          type="button"
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-black/60 lg:hidden"
        >
          <Menu size={18} />
        </button>

     
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2.5">
        {/* SEARCH */}
        <button
          type="button"
          aria-label="Search"
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-black/45 transition hover:border-black/15 hover:bg-black/[0.025] hover:text-black md:flex"
        >
          <Search size={17} strokeWidth={1.8} />
        </button>

        {/* NOTIFICATION */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-black/45 transition hover:border-black/15 hover:bg-black/[0.025] hover:text-black"
        >
          <Bell size={17} strokeWidth={1.8} />

          <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-[#ffb646] ring-2 ring-white" />
        </button>

        {/* DIVIDER */}
        <div className="mx-1 hidden h-7 w-px bg-black/[0.08] sm:block" />

        {/* PROFILE */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-black/[0.035]"
          >
            {/* AVATAR */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#080808] text-[11px] font-bold text-white">
              AD
            </div>

            {/* DETAILS */}
            <div className="hidden text-left sm:block">
              <p className="max-w-[130px] truncate text-[13px] font-bold text-[#080808]">
                Administrator
              </p>

              <p className="text-[10px] capitalize font-medium text-black/40">
                Admin
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`hidden text-black/40 transition-transform sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* PROFILE DROPDOWN */}
          {profileOpen && (
            <div className="absolute right-0 top-[52px] w-[240px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_15px_50px_rgba(0,0,0,0.08)]">
              {/* PROFILE HEADER */}
              <div className="border-b border-black/[0.07] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#080808] text-xs font-bold text-white">
                    AD
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#080808]">
                      Administrator
                    </p>

                    <p className="mt-0.5 truncate text-[11px] font-medium text-black/40">
                      connect@zoidics.com
                    </p>
                  </div>
                </div>
              </div>

              {/* MENU */}
              <div className="p-2">
                {/* ACCOUNT SETTINGS */}
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-black/60 transition hover:bg-black/[0.04] hover:text-black"
                >
                  <Settings size={15} strokeWidth={1.8} />
                  Account settings
                </button>

                {/* LOGOUT */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <LogOut size={15} strokeWidth={1.8} />
                  )}

                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
