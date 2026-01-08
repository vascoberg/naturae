import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { PasswordForm } from "@/components/settings/password-form";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, bio")
    .eq("id", user!.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Instellingen</h1>
        <p className="text-muted-foreground">Beheer je account en voorkeuren</p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Je account gegevens</CardDescription>
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
          </CardContent>
        </Card>

        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profielfoto</CardTitle>
            <CardDescription>
              Je profielfoto wordt getoond bij je leersets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentAvatarUrl={profile?.avatar_url || null}
              username={profile?.username || ""}
            />
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profiel</CardTitle>
            <CardDescription>
              Personaliseer hoe anderen je zien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialDisplayName={profile?.display_name || null}
              initialBio={profile?.bio || null}
            />
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wachtwoord</CardTitle>
            <CardDescription>
              Wijzig je wachtwoord
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        {/* About */}
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
