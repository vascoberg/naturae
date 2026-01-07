"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
