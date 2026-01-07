import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Haal profiel op
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  // Als geen username, redirect naar onboarding
  if (!profile?.username) {
    redirect("/onboarding");
  }

  const displayName = profile.display_name || profile.username;

  return (
    <AppShell username={profile.username} displayName={displayName}>
      {children}
    </AppShell>
  );
}
