"use client";

import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { SidebarProvider } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { MainContent } from "./main-content";

interface AppShellProps {
  children: ReactNode;
  username: string;
  displayName: string;
}

export function AppShell({ children, username, displayName }: AppShellProps) {
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Full page reload to clear session and go to landing page
    window.location.href = "/";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar
          username={username}
          displayName={displayName}
          onLogout={handleLogout}
        />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
