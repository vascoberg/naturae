import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Als ingelogd, toon de normale app shell
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single();

    const displayName = profile?.display_name || profile?.username || "User";
    const username = profile?.username || "user";

    return (
      <AppShell username={username} displayName={displayName}>
        {children}
      </AppShell>
    );
  }

  // Voor gasten: toon publieke header
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
            <Image
              src="/images/logo.png"
              alt="Naturae"
              width={28}
              height={28}
              className="w-7 h-7 flex-shrink-0"
            />
            Naturae
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/discover"
              className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ontdek
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Inloggen</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Registreren</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Naturae - Leer de natuur kennen
            </p>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/discover" className="hover:text-foreground">
                Ontdek
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/login" className="hover:text-foreground">
                Inloggen
              </Link>
              <Link href="/signup" className="hover:text-foreground">
                Registreren
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
