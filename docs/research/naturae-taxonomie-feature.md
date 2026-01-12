# Taxonomie-integratie voor Naturae.app

## 1. Context & Doel

### Huidige situatie
Naturae.app is een leerplatform voor natuurherkenning waar gebruikers flashcard-sets kunnen aanmaken en delen. Sets bevatten kaarten met afbeeldingen en geluid om soorten te leren herkennen.

Op dit moment:
- Kunnen gebruikers vrij kaarten aanmaken zonder koppeling aan een taxonomisch systeem
- Is er een label-systeem voor categorisering (beheerd door admin)
- Is er geen gestandaardiseerde manier om soorten te identificeren across sets

### Waarom taxonomie?
Een taxonomisch systeem als ruggengraat maakt naturae.app onderscheidend van generieke flashcard-apps zoals Quizlet:

- **Consistentie**: "Paardenbijter" in set A is gegarandeerd dezelfde soort als in set B
- **Navigatie**: Gebruikers kunnen browsen via taxonomische hiërarchie (Insecten → Libellen → Glazenmakers)
- **Cross-set features**: Statistieken per soort, gerelateerde soorten, soorten die vaak verward worden
- **Fundament voor toekomstige features**: Soortpagina's, verspreidingskaarten, ecologische informatie

---

## 2. Kernbeslissingen

### Databron: GBIF
We gebruiken de [GBIF (Global Biodiversity Information Facility)](https://www.gbif.org/) API als taxonomische backbone:
- Internationale standaard, breed gebruikt
- Gratis API zonder authenticatie voor basis-calls
- Bevat wetenschappelijke namen, synoniemen, Nederlandse namen, volledige hiërarchie
- Elke soort heeft een unieke `usageKey` (taxon ID)

### Koppelingsstrategie: Gestuurd, niet verplicht
- Bij het aanmaken van een kaart krijgt de gebruiker een autocomplete-suggestie voor soorten
- Koppeling is optioneel — kaarten zonder soortkoppeling blijven functioneren
- Dit zorgt voor backwards compatibility en lage drempel

### Species tabel als basis
Een centrale `species` tabel die gevuld wordt on-demand wanneer soorten voor het eerst gekoppeld worden.

---

## 3. Datamodel

### Onderzoeksvraag
> **Voor implementatie**: Breng de huidige database-structuur in kaart. Welke tabellen bestaan er voor decks, cards, labels? Wat zijn de primary keys en bestaande relaties?

### Voorstel: Species tabel

```sql
CREATE TABLE species (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gbif_key INTEGER UNIQUE NOT NULL,          -- GBIF usageKey
    scientific_name TEXT NOT NULL,              -- "Aeshna cyanea"
    canonical_name TEXT,                        -- "Aeshna cyanea" (zonder auteur)
    vernacular_name_nl TEXT,                    -- "Blauwe glazenmaker"
    
    -- Taxonomische hiërarchie
    kingdom TEXT,                               -- "Animalia"
    phylum TEXT,                                -- "Arthropoda"
    class TEXT,                                 -- "Insecta"
    "order" TEXT,                               -- "Odonata"
    family TEXT,                                -- "Aeshnidae"
    genus TEXT,                                 -- "Aeshna"
    
    -- GBIF keys voor hiërarchie (voor navigatie)
    family_key INTEGER,
    order_key INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Voorstel: Koppeling met kaarten

```sql
-- Optie A: Directe foreign key op cards tabel
ALTER TABLE cards ADD COLUMN species_id UUID REFERENCES species(id);

-- Optie B: Koppeltabel (als een kaart meerdere soorten kan bevatten)
CREATE TABLE card_species (
    card_id UUID REFERENCES cards(id),
    species_id UUID REFERENCES species(id),
    PRIMARY KEY (card_id, species_id)
);
```

> **Beslispunt**: Kan één kaart meerdere soorten bevatten, of is het altijd 1:1?

---

## 4. Implementatiestappen

### Fase 1: Basis infrastructuur
1. Species tabel aanmaken
2. GBIF service/utility bouwen voor API calls
3. Endpoint om soort op te zoeken/toe te voegen

### Fase 2: Koppeling UI
1. Autocomplete component bij kaart-aanmaak
2. Soortselectie opslaan bij kaart
3. Bestaande kaarten blijven werken (species_id nullable)

### Fase 3: Taxonomisch navigeren
1. Filter/zoek op soortgroep in discover-pagina
2. Tonen van taxonomische info bij sets/kaarten
3. "Bekijk alle sets met deze soort" functionaliteit

### Toekomstig (v2+)
- Soortpagina's met rijke informatie
- Verspreidingskaarten via GBIF occurrence data
- Geluidsintegratie via Xeno-canto API
- Cross-set leerstatistieken per soort

---

## 5. GBIF API Integratie

### Primaire endpoint: Species Match
```
GET https://api.gbif.org/v1/species/match?name={zoekterm}
```

Voorbeeld response:
```json
{
    "usageKey": 1428038,
    "scientificName": "Aeshna cyanea (Müller, 1764)",
    "canonicalName": "Aeshna cyanea",
    "rank": "SPECIES",
    "status": "ACCEPTED",
    "kingdom": "Animalia",
    "phylum": "Arthropoda",
    "class": "Insecta",
    "order": "Odonata",
    "family": "Aeshnidae",
    "genus": "Aeshna",
    "kingdomKey": 1,
    "phylumKey": 54,
    "classKey": 216,
    "orderKey": 789,
    "familyKey": 4209,
    "genusKey": 1428032,
    "speciesKey": 1428038
}
```

### Secundair: Suggest (voor autocomplete)
```
GET https://api.gbif.org/v1/species/suggest?q={zoekterm}
```

Geeft lijst van mogelijke matches — beter voor autocomplete UX.

### Vernacular names (Nederlandse namen)
```
GET https://api.gbif.org/v1/species/{usageKey}/vernacularNames
```

### Edge cases
- **Geen match**: Toon melding, sta toe om zonder koppeling door te gaan
- **Meerdere matches**: Toon lijst, laat gebruiker kiezen
- **Synoniemen**: GBIF resolved automatisch naar geaccepteerde naam

---

## 6. UX Overwegingen

### Autocomplete flow
1. Gebruiker begint te typen in soortnaam-veld
2. Na 2-3 karakters: call naar GBIF suggest endpoint
3. Toon dropdown met matches (wetenschappelijke + Nederlandse naam)
4. Gebruiker selecteert of typt verder
5. Bij selectie: haal volledige soortinfo op en sla op in species tabel (indien nieuw)

### Geen koppeling
- Duidelijk maken dat koppeling optioneel is
- Kaarten zonder koppeling werken normaal
- Eventueel later: prompt om alsnog te koppelen

### Backwards compatibility
- Bestaande kaarten krijgen `species_id = NULL`
- Alle huidige functionaliteit blijft werken
- Taxonomie-features alleen beschikbaar voor gekoppelde kaarten

---

## 7. Toekomstige mogelijkheden

Deze taxonomie-basis maakt mogelijk:

| Feature | Beschrijving | Benodigde data |
|---------|--------------|----------------|
| Soortpagina's | Overzicht van soort met foto's, geluid, ecologie | species tabel + externe APIs |
| Verspreidingskaarten | Waar komt de soort voor? | GBIF occurrence API |
| Geluidsintegratie | Zang/roep per soort | Xeno-canto API |
| "Lijkt op" suggesties | Soorten die vaak verward worden | Handmatig of ML |
| Leerstatistieken per soort | "Je herkent glazenmakers goed" | species_id op cards + user progress |
| Taxonomische browser | Navigeer als boomstructuur | family_key, order_key relaties |

---

## 8. Open vragen voor implementatie

- [ ] Huidige database schema in kaart brengen (decks, cards, labels tabellen)
- [ ] Keuze: 1 soort per kaart of meerdere mogelijk?
- [ ] Waar wordt de GBIF API call gemaakt? (Frontend/Backend)
- [ ] Caching strategie voor GBIF responses?
- [ ] Hoe om te gaan met soorten die niet in GBIF staan?
- [ ] Moeten Nederlandse namen apart opgehaald worden of volstaat wat GBIF match teruggeeft?
