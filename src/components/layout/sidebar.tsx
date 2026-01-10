"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Library,
  Compass,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

interface SidebarProps {
  username: string;
  displayName: string;
  onLogout: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/my-decks", label: "Mijn leersets", icon: Library },
  { href: "/discover", label: "Ontdek", icon: Compass },
  { href: "/settings", label: "Instellingen", icon: Settings },
];

export function Sidebar({ username, displayName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobile } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Op mobiel altijd labels tonen (sidebar is slide-out menu)
  const showLabels = isMobile ? true : !isCollapsed;
  const compactMode = isMobile ? false : isCollapsed;

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 border-b">
        <Image
          src="/images/logo.png"
          alt="Naturae"
          width={32}
          height={32}
          className="w-8 h-8 flex-shrink-0"
        />
        {showLabels && (
          <span className="font-semibold text-lg text-primary">Naturae</span>
        )}
      </div>

      {/* New deck button */}
      <div className="p-3">
        <Link href="/decks/new">
          <Button
            className={cn(
              "w-full justify-start gap-2",
              compactMode && "justify-center px-2"
            )}
          >
            <Plus className="w-4 h-4" />
            {showLabels && <span>Nieuwe leerset</span>}
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    compactMode && "justify-center px-2"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {showLabels && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2",
            compactMode && "justify-center px-2"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {showLabels && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                @{username}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-1",
            compactMode && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {showLabels && <span>Uitloggen</span>}
        </button>
      </div>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="border-t p-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-full p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
    </>
  );

  // Mobile: hamburger menu
  if (isMobile) {
    return (
      <>
        {/* Mobile header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b h-14 flex items-center px-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1">
              <span className="block w-5 h-0.5 bg-foreground" />
              <span className="block w-5 h-0.5 bg-foreground" />
              <span className="block w-5 h-0.5 bg-foreground" />
            </div>
          </button>
          <div className="flex items-center gap-2 ml-3">
            <Image
              src="/images/logo.png"
              alt="Naturae"
              width={20}
              height={20}
              className="w-5 h-5 flex-shrink-0"
            />
            <span className="font-semibold text-primary">Naturae</span>
          </div>
        </header>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 z-50 h-full w-64 bg-background border-r flex flex-col transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  // Desktop: collapsible sidebar
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full bg-background border-r flex flex-col transition-all duration-200 z-30",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
