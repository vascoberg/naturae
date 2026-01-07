"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewDeckPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Titel is verplicht");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: deck, error: insertError } = await supabase
        .from("decks")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          user_id: user.id,
          is_public: false,
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      // Redirect naar deck pagina waar kaarten toegevoegd kunnen worden
      router.push(`/decks/${deck.id}`);
    } catch (err) {
      console.error("Error creating deck:", err);
      setError("Er ging iets mis bij het aanmaken van de leerset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/my-decks"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Terug naar mijn leersets
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nieuwe leerset</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Titel <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                type="text"
                placeholder="bijv. Nederlandse Amfibieën"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Beschrijving
              </label>
              <textarea
                id="description"
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Korte beschrijving van de leerset..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                maxLength={500}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Aanmaken..." : "Leerset aanmaken"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Annuleren
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
