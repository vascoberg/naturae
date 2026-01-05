"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Check of user al een username heeft
  useEffect(() => {
    const checkUsername = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profile?.username) {
        // Heeft al username, door naar dashboard
        router.push("/dashboard");
        return;
      }

      setChecking(false);
    };

    checkUsername();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validatie
    const trimmedUsername = username.toLowerCase().trim();

    if (trimmedUsername.length < 3) {
      setError("Username moet minimaal 3 tekens zijn");
      return;
    }

    if (trimmedUsername.length > 30) {
      setError("Username mag maximaal 30 tekens zijn");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError("Username mag alleen letters, cijfers en underscores bevatten");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Je bent niet ingelogd");
      setLoading(false);
      return;
    }

    // Check of username al bestaat
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimmedUsername)
      .single();

    if (existing) {
      setError("Deze username is al in gebruik");
      setLoading(false);
      return;
    }

    // Update profile met username
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: trimmedUsername })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Kies je username</CardTitle>
          <CardDescription>
            Dit is hoe andere gebruikers je zien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="jouw_username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Alleen kleine letters, cijfers en underscores. 3-30 tekens.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Opslaan..." : "Doorgaan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
