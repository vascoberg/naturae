import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-primary">Naturae</h1>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Inloggen</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Registreren</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Leer soorten herkennen
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Naturae helpt je om planten, dieren en andere soorten te leren herkennen
            met slimme flashcards en spaced repetition.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Gratis beginnen</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Ik heb al een account</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Naturae - Leer de natuur kennen
        </div>
      </footer>
    </div>
  );
}
