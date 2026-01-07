"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Use window.location to ensure a full page reload after signOut
    // This prevents race conditions with the middleware
    window.location.href = "/";
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      Uitloggen
    </Button>
  );
}
