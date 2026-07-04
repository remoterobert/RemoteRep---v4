"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  UserCircleIcon,
  BellIcon as BellIconOutline,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { logout } from "@/app/(auth)/actions";

export function UserMenu({
  email,
  displayName,
  initials,
  isHiring,
}: {
  email: string;
  displayName: string;
  initials: string;
  isHiring: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Position the fixed dropdown relative to the button in viewport coords.
  // Using `position: fixed` sidesteps every ancestor stacking context / overflow
  // clip (topbar has backdrop-blur which creates a context that traps
  // absolutely-positioned children).
  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const profileHref = isHiring ? "/company/edit" : "/profile/edit";
  const profileLabel = isHiring ? "Edit company" : "Edit profile";
  const ProfileIcon = isHiring ? BuildingOffice2Icon : UserCircleIcon;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 -m-1.5 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center shadow-sm">
          {initials}
        </div>
        <span className="text-sm font-medium text-dark-foreground dark:text-white hidden sm:inline">
          {displayName}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-dark-foreground dark:text-white transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={
            pos
              ? { position: "fixed", top: pos.top, right: pos.right }
              : { position: "fixed", visibility: "hidden" }
          }
          className="w-64 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0b1220] shadow-xl shadow-black/10 py-2 z-[100] origin-top-right"
        >
          {/* Header — identity */}
          <div className="px-3 pt-2 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">
                  {displayName}
                </div>
                <div className="text-xs text-light-grey truncate">{email}</div>
              </div>
            </div>
          </div>

          {/* Section: Account */}
          <MenuGroup label="Account">
            <MenuLink
              href={profileHref}
              icon={<ProfileIcon className="h-4 w-4" />}
              label={profileLabel}
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/settings"
              icon={<Cog6ToothIcon className="h-4 w-4" />}
              label="Account settings"
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/settings/notifications"
              icon={<BellIconOutline className="h-4 w-4" />}
              label="Notifications"
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/settings/billing"
              icon={<CreditCardIcon className="h-4 w-4" />}
              label="Billing"
              onClick={() => setOpen(false)}
            />
          </MenuGroup>

          {/* Sign out */}
          <div className="pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
            <form action={logout} className="contents">
              <button
                type="submit"
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function MenuGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wider font-bold text-light-grey">
        {label}
      </div>
      {children}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-dark-foreground dark:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
    >
      <span className="text-light-grey">{icon}</span>
      {label}
    </Link>
  );
}
