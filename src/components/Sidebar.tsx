"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  LifebuoyIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BuildingOffice2Icon as BuildingIcon,
} from "@heroicons/react/24/outline";
import { logout } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Icon = any;

export type NavItem = {
  name: string;
  href: string;
  icon: Icon;
  newTab?: boolean;
  badge?: number;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

const HIRING_ICON_MAP: Record<string, Icon> = {
  Dashboard: HomeIcon,
  "Job listings": ClipboardDocumentListIcon,
  "Browse talent": UserGroupIcon,
  Chats: ChatBubbleLeftRightIcon,
  Resources: BookOpenIcon,
  Affiliates: ShareIcon,
  Support: LifebuoyIcon,
};

const TALENT_ICON_MAP: Record<string, Icon> = {
  Dashboard: HomeIcon,
  Opportunities: ClipboardDocumentListIcon,
  "Browse clients": BuildingOffice2Icon,
  Chats: ChatBubbleLeftRightIcon,
  Resources: BookOpenIcon,
  Affiliates: ShareIcon,
  Support: LifebuoyIcon,
};

export function buildHiringNav(): NavItem[] {
  return [
    { name: "Dashboard", href: "/dashboard", icon: HIRING_ICON_MAP.Dashboard },
    {
      name: "Job listings",
      href: "/company/listings",
      icon: HIRING_ICON_MAP["Job listings"],
    },
    {
      name: "Browse talent",
      href: "/candidates",
      icon: HIRING_ICON_MAP["Browse talent"],
    },
    { name: "Chats", href: "/chats", icon: HIRING_ICON_MAP.Chats },
    {
      name: "Resources",
      href: "https://portal.remoterep.com/companies",
      icon: HIRING_ICON_MAP.Resources,
      newTab: true,
    },
    { name: "Affiliates", href: "#", icon: HIRING_ICON_MAP.Affiliates },
    {
      name: "Support",
      href: "#",
      icon: HIRING_ICON_MAP.Support,
      newTab: true,
    },
  ];
}

export function buildTalentNav(): NavItem[] {
  return [
    { name: "Dashboard", href: "/dashboard", icon: TALENT_ICON_MAP.Dashboard },
    {
      name: "Opportunities",
      href: "/opportunities",
      icon: TALENT_ICON_MAP.Opportunities,
    },
    {
      name: "Browse clients",
      href: "#",
      icon: TALENT_ICON_MAP["Browse clients"],
    },
    { name: "Chats", href: "/chats", icon: TALENT_ICON_MAP.Chats },
    {
      name: "Resources",
      href: "https://portal.remoterep.com/talent",
      icon: TALENT_ICON_MAP.Resources,
      newTab: true,
    },
    { name: "Affiliates", href: "#", icon: TALENT_ICON_MAP.Affiliates },
    { name: "Support", href: "#", icon: TALENT_ICON_MAP.Support, newTab: true },
  ];
}

export function Sidebar({
  navigation,
  tenantName,
  isHiring,
  isPlatformAdmin,
  displayName,
  email,
  initials,
  unreadChats,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapsed,
}: {
  navigation: NavItem[];
  tenantName: string;
  isHiring: boolean;
  isPlatformAdmin: boolean;
  displayName: string;
  email: string;
  initials: string;
  unreadChats: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close profile menu on click-out
  useEffect(() => {
    if (!profileMenuOpen) return;
    function onClick(e: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileMenuOpen]);

  const profileHref = isHiring ? "/company/edit" : "/profile/edit";
  const overviewItems = navigation;

  // Chat badge lives on the Chats nav item
  const withBadges = overviewItems.map((it) =>
    it.name === "Chats" && unreadChats > 0
      ? { ...it, badge: unreadChats }
      : it,
  );

  const widthCls = collapsed ? "w-[68px]" : "w-[260px]";
  const isVisibleMobile = mobileOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Main navigation"
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-surface-2 border-r border-border
          transition-[transform,width] duration-200 ease-out
          lg:translate-x-0
          ${widthCls}
          ${isVisibleMobile}
        `}
      >
        {/* Floating collapse toggle — sits on the sidebar's right edge
            so it never overflows the collapsed 68px width. */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex absolute top-[52px] -right-3 z-20 h-6 w-6 items-center justify-center rounded-full bg-surface-2 border border-border hover:bg-surface-3 text-light-grey shadow-sm transition-colors"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-3 w-3" />
          ) : (
            <ChevronLeftIcon className="h-3 w-3" />
          )}
        </button>

        {/* Header — tenant identity (logo + name) */}
        <div
          className={`h-16 shrink-0 flex items-center gap-2 border-b border-border ${collapsed ? "px-0 justify-center" : "px-3"}`}
        >
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/20">
            <Image
              src="/v3-white-logo.svg"
              alt="RemoteRep"
              width={20}
              height={20}
              className="dark:opacity-100 opacity-0 dark:block hidden"
              priority
            />
            <Image
              src="/v3-logo.svg"
              alt="RemoteRep"
              width={20}
              height={20}
              className="dark:hidden"
              priority
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-tight truncate">
                {tenantName}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-light-grey leading-tight">
                {isHiring ? "Hiring" : "Talent"}
              </div>
            </div>
          )}
        </div>

        {/* Nav — Overview group */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <NavGroup label="Overview" collapsed={collapsed}>
            {withBadges.map((item) => (
              <NavRow
                key={item.name}
                item={item}
                active={isActive(pathname, item.href)}
                collapsed={collapsed}
              />
            ))}
            {isPlatformAdmin && (
              <NavRow
                item={{
                  name: "Admin",
                  href: "/admin",
                  icon: ShieldCheckIcon,
                }}
                active={pathname.startsWith("/admin")}
                collapsed={collapsed}
                emphasis="admin"
              />
            )}
          </NavGroup>
        </nav>

        {/* Account group */}
        <div className="px-2 pb-2 space-y-0.5 border-t border-border pt-3">
          <NavGroup label="Account" collapsed={collapsed}>
            <NavRow
              item={{
                name: isHiring ? "Company profile" : "Your profile",
                href: profileHref,
                icon: isHiring ? BuildingIcon : UserCircleIcon,
              }}
              active={
                pathname.startsWith(profileHref) ||
                pathname === (isHiring ? "/company/edit" : "/profile/edit")
              }
              collapsed={collapsed}
            />
            <NavRow
              item={{
                name: "Settings",
                href: "/settings",
                icon: Cog6ToothIcon,
              }}
              active={pathname.startsWith("/settings")}
              collapsed={collapsed}
            />
          </NavGroup>
        </div>

        {/* Theme toggle */}
        <div className="px-3 pb-2">
          <ThemeToggle label={!collapsed} />
        </div>

        {/* Profile block bottom */}
        <div
          className="border-t border-border p-2 relative"
          ref={profileMenuRef}
        >
          <button
            type="button"
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            className={`w-full flex items-center gap-2.5 rounded-lg p-2 hover:bg-surface-3 transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <div className="h-9 w-9 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <div className="text-sm font-semibold truncate">
                  {displayName}
                </div>
                <div className="text-[11px] text-light-grey truncate">
                  {email}
                </div>
              </div>
            )}
          </button>

          {profileMenuOpen && (
            <div
              role="menu"
              className={`absolute bottom-full mb-2 rounded-xl border border-border bg-surface-3 shadow-2xl overflow-hidden ${collapsed ? "left-full ml-2 w-56" : "left-2 right-2"}`}
            >
              <form action={logout} className="contents">
                <button
                  type="submit"
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function NavGroup({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      {!collapsed && (
        <div className="px-3 mb-1 text-[10px] uppercase tracking-wider font-bold text-light-grey">
          {label}
        </div>
      )}
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function NavRow({
  item,
  active,
  collapsed,
  emphasis,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  emphasis?: "admin";
}) {
  const Icon = item.icon;
  const cls = active
    ? "bg-primary/10 text-primary font-semibold"
    : "text-foreground/80 hover:text-foreground hover:bg-surface-3";
  const emphasisCls =
    emphasis === "admin"
      ? "border-t border-border mt-2 pt-3 text-secondary/90 hover:text-secondary"
      : "";
  return (
    <li>
      <Link
        href={item.href}
        target={item.newTab ? "_blank" : undefined}
        rel={item.newTab ? "noopener noreferrer" : undefined}
        title={collapsed ? item.name : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative ${cls} ${emphasisCls} ${collapsed ? "justify-center" : ""}`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="min-w-0 truncate">{item.name}</span>}
        {!!item.badge && !collapsed && (
          <span className="ml-auto inline-flex items-center justify-center text-[10px] font-bold min-w-5 h-5 rounded-full bg-primary text-white px-1.5">
            {item.badge}
          </span>
        )}
        {!!item.badge && collapsed && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        )}
      </Link>
    </li>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "#" || href.startsWith("http")) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}
