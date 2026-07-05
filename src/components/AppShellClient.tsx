"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bars3Icon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { Sidebar, type NavItem } from "@/components/Sidebar";

const COLLAPSE_KEY = "remoterep.sidebar.collapsed";

/**
 * Client-side shell. Owns the sidebar-collapse and mobile-drawer
 * state so the content area can respond to the sidebar's width in
 * lockstep. Server data (nav items, tenant identity, user profile
 * bits) is passed in as plain props.
 */
export function AppShellClient({
  navigation,
  tenantName,
  isHiring,
  isPlatformAdmin,
  displayName,
  email,
  initials,
  unreadChats,
  children,
}: {
  navigation: NavItem[];
  tenantName: string;
  isHiring: boolean;
  isPlatformAdmin: boolean;
  displayName: string;
  email: string;
  initials: string;
  unreadChats: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  const onToggleCollapsed = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Match the width tokens in Sidebar.tsx. Kept in one place so any
  // future change (e.g., different widths on 2xl) only lands here.
  const contentPadCls = collapsed ? "lg:pl-[68px]" : "lg:pl-[260px]";

  return (
    <>
      <Sidebar
        navigation={navigation}
        tenantName={tenantName}
        isHiring={isHiring}
        isPlatformAdmin={isPlatformAdmin}
        displayName={displayName}
        email={email}
        initials={initials}
        unreadChats={unreadChats}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={onToggleCollapsed}
      />

      <div
        className={`min-h-screen flex flex-col ${contentPadCls}`}
        style={mounted ? undefined : { transitionDuration: "0ms" }}
      >
        <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-3 lg:px-6 bg-surface/80 backdrop-blur-md border-b border-border">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded hover:bg-surface-3 text-foreground"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="lg:hidden font-semibold text-sm">RemoteRep</div>

          <div className="flex-1" />

          <button
            type="button"
            aria-label="Notifications"
            className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded hover:bg-surface-3 text-foreground/80"
          >
            <BellIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 flex flex-col w-full">{children}</main>
      </div>
    </>
  );
}
