import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user!.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Instellingen</h1>
        <p className="text-muted-foreground">Beheer je account en voorkeuren</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Gebruikersnaam
              </label>
              <p className="mt-1">@{profile?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Weergavenaam
              </label>
              <p className="mt-1">
                {profile?.display_name || profile?.username}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Over Naturae</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Naturae is een platform voor natuurliefhebbers om soortherkenning
              te leren met behulp van flashcards en spaced repetition.
            </p>
            <p className="text-sm text-muted-foreground mt-2">Versie 0.1.0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
