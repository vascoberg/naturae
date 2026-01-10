import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacybeleid - Naturae",
  description: "Hoe Naturae omgaat met je gegevens",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Privacybeleid</h1>

      <p className="text-muted-foreground mb-8">
        Laatst bijgewerkt: januari 2026
      </p>

      <div className="prose prose-neutral max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Overzicht</h2>
          <p className="text-muted-foreground leading-relaxed">
            Naturae is een gratis webapp om soorten te leren herkennen. We verzamelen
            zo min mogelijk gegevens en respecteren je privacy. Deze pagina legt uit
            welke gegevens we verwerken en waarom.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Welke gegevens verzamelen we?</h2>

          <h3 className="text-lg font-medium mt-6 mb-3">Accountgegevens</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Als je een account aanmaakt, slaan we op:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Je e-mailadres (voor inloggen en accountherstel)</li>
            <li>Je gebruikersnaam en weergavenaam</li>
            <li>Je leersets en voortgang</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Deze gegevens worden opgeslagen in{" "}
            <a href="https://supabase.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Supabase
            </a>
            , een beveiligde database-service.
          </p>

          <h3 className="text-lg font-medium mt-6 mb-3">Analytics</h3>
          <p className="text-muted-foreground leading-relaxed">
            We gebruiken{" "}
            <a href="https://vercel.com/analytics" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Vercel Analytics
            </a>
            {" "}om te begrijpen hoe de app wordt gebruikt. Dit is privacy-vriendelijke
            analytics die:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
            <li><strong>Geen cookies plaatst</strong></li>
            <li>Geen persoonlijke gegevens verzamelt</li>
            <li>Je niet volgt over websites heen</li>
            <li>Alleen anonieme, geaggregeerde data verzamelt (paginaweergaven, land, browser)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Naturae gebruikt alleen technisch noodzakelijke cookies voor authenticatie
            (om je ingelogd te houden). We gebruiken geen tracking cookies of
            advertentie-cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Je rechten</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Onder de AVG (GDPR) heb je het recht om:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Je gegevens in te zien</li>
            <li>Je gegevens te laten corrigeren</li>
            <li>Je account en gegevens te laten verwijderen</li>
            <li>Je gegevens te exporteren</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Je kunt je account verwijderen via de instellingen, of neem contact met ons op.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Gegevens delen</h2>
          <p className="text-muted-foreground leading-relaxed">
            We verkopen je gegevens niet en delen ze niet met derden, behalve de
            technische diensten die nodig zijn om de app te laten werken (Supabase
            voor de database, Vercel voor hosting, Resend voor e-mail).
          </p>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t">
        <Link href="/" className="text-primary hover:underline">
          &larr; Terug naar home
        </Link>
      </div>
    </div>
  );
}
