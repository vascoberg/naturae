# Email Templates voor Naturae

Deze templates kun je kopiëren naar Supabase Dashboard.

## Instructies

1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecteer je Naturae project
3. Ga naar **Authentication** (linker menu)
4. Klik op **Email Templates** (onder Configuration)
5. Pas elke template aan met onderstaande content

**Let op:** In Resend hoef je niets aan te passen. Resend is alleen de SMTP provider die de emails verstuurt. De templates worden beheerd in Supabase.

---

## 1. Confirm Signup (Bevestig aanmelding)

**Subject:**
```
Bevestig je Naturae account
```

**Body:**
```html
<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<h2 style="margin-top: 0;">Welkom bij Naturae!</h2>

<p>Bedankt voor je aanmelding. Klik op de onderstaande link om je account te bevestigen:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 500;">Bevestig mijn account</a></p>

<p style="margin-top: 20px;">Of kopieer deze link naar je browser:<br>
<span style="color: #666; word-break: break-all;">{{ .ConfirmationURL }}</span></p>

<p style="color: #666;">Deze link is 24 uur geldig.</p>

<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

<p style="color: #999; font-size: 12px;">
Je ontvangt deze email omdat je een account hebt aangemaakt op <a href="https://naturae.app" style="color: #3b82f6;">naturae.app</a>.<br>
Als je dit niet was, kun je deze email negeren.
</p>
</div>
```

---

## 2. Reset Password (Wachtwoord resetten)

**Subject:**
```
Wachtwoord resetten voor Naturae
```

**Body:**
```html
<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<h2 style="margin-top: 0;">Wachtwoord resetten</h2>

<p>Je hebt een verzoek ingediend om je wachtwoord te resetten. Klik op de onderstaande link:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 500;">Reset mijn wachtwoord</a></p>

<p style="margin-top: 20px;">Of kopieer deze link naar je browser:<br>
<span style="color: #666; word-break: break-all;">{{ .ConfirmationURL }}</span></p>

<p style="color: #666;">Deze link is 24 uur geldig.</p>

<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

<p style="color: #999; font-size: 12px;">
Als je geen wachtwoord reset hebt aangevraagd, kun je deze email negeren.<br>
<a href="https://naturae.app" style="color: #3b82f6;">Naturae</a> - Leer soorten herkennen
</p>
</div>
```

---

## 3. Magic Link (Inloggen via link)

**Subject:**
```
Je login link voor Naturae
```

**Body:**
```html
<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<h2 style="margin-top: 0;">Inloggen bij Naturae</h2>

<p>Klik op de onderstaande link om in te loggen:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 500;">Log in bij Naturae</a></p>

<p style="margin-top: 20px;">Of kopieer deze link naar je browser:<br>
<span style="color: #666; word-break: break-all;">{{ .ConfirmationURL }}</span></p>

<p style="color: #666;">Deze link is 1 uur geldig en kan maar een keer gebruikt worden.</p>

<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

<p style="color: #999; font-size: 12px;">
Als je niet hebt geprobeerd in te loggen, kun je deze email negeren.<br>
<a href="https://naturae.app" style="color: #3b82f6;">Naturae</a> - Leer soorten herkennen
</p>
</div>
```

---

## 4. Change Email (Email wijzigen)

**Subject:**
```
Bevestig je nieuwe emailadres voor Naturae
```

**Body:**
```html
<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<h2 style="margin-top: 0;">Emailadres wijzigen</h2>

<p>Je hebt gevraagd om je emailadres te wijzigen. Klik op de onderstaande link om je nieuwe emailadres te bevestigen:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 500;">Bevestig nieuw emailadres</a></p>

<p style="margin-top: 20px;">Of kopieer deze link naar je browser:<br>
<span style="color: #666; word-break: break-all;">{{ .ConfirmationURL }}</span></p>

<p style="color: #666;">Deze link is 24 uur geldig.</p>

<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

<p style="color: #999; font-size: 12px;">
Als je dit niet hebt aangevraagd, neem dan contact met ons op.<br>
<a href="https://naturae.app" style="color: #3b82f6;">Naturae</a> - Leer soorten herkennen
</p>
</div>
```

---

## 5. Invite User (Gebruiker uitnodigen) - Optioneel

**Subject:**
```
Je bent uitgenodigd voor Naturae
```

**Body:**
```html
<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<h2 style="margin-top: 0;">Je bent uitgenodigd!</h2>

<p>Je bent uitgenodigd om lid te worden van Naturae, de app om soorten te leren herkennen.</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 500;">Accepteer uitnodiging</a></p>

<p style="margin-top: 20px;">Of kopieer deze link naar je browser:<br>
<span style="color: #666; word-break: break-all;">{{ .ConfirmationURL }}</span></p>

<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

<p style="color: #999; font-size: 12px;">
<a href="https://naturae.app" style="color: #3b82f6;">Naturae</a> - Leer soorten herkennen
</p>
</div>
```

---

## Styling notities

De email templates gebruiken dezelfde kleuren als de webapp:

| Element | Kleur | Webapp equivalent |
|---------|-------|-------------------|
| Primary (buttons) | `#3b82f6` | `--primary` (Tailwind blue-500) |
| Muted text | `#666` | `--muted-foreground` |
| Light text | `#999` | Lichter dan muted |
| Border | `#eee` | `--border` |
| Border radius | `10px` | `--radius: 0.625rem` |
| Font | Inter + fallbacks | `--font-inter` |

**Font fallback chain:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Inter wordt gebruikt als het beschikbaar is (sommige email clients laden webfonts)
- Apple devices krijgen SF Pro (via -apple-system)
- Windows krijgt Segoe UI
- Android krijgt Roboto
- Als niets werkt: standaard sans-serif

**Waarom hex codes?** Email clients ondersteunen geen CSS variabelen of oklch(). Daarom gebruiken we hex equivalenten.

## Testen

Na het instellen van de templates kun je testen door:
1. Een nieuw account aan te maken (Confirm Signup)
2. Wachtwoord vergeten te gebruiken (Reset Password)
3. Magic link login te proberen als dat is ingeschakeld
