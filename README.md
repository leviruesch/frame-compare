# Frame Compare

Zwei Videos Frame für Frame vergleichen, Linien und Winkel einzeichnen, Videos in einer lokalen Galerie sammeln.
Alles läuft im Browser. Videos und Einstellungen bleiben auf dem Gerät (IndexedDB), es gibt keinen Server und keine Cloud.

## Auf GitHub Pages veröffentlichen

1. Bei https://github.com ein Konto anlegen und einloggen.
2. Oben rechts auf **+ → New repository**. Name z. B. `frame-compare`. Sichtbarkeit **Public** (im Free-Plan nötig). **Create repository**.
3. Im neuen Repository auf **uploading an existing file** klicken und **alle Dateien aus diesem Ordner** hineinziehen
   (index.html, app.js, style.css, sw.js, manifest.webmanifest, die drei icon-*.png, .nojekyll). Dann **Commit changes**.
   Wichtig: Die Dateien müssen direkt im Hauptverzeichnis liegen, nicht in einem Unterordner.
4. **Settings → Pages**. Unter **Build and deployment** bei **Source** „Deploy from a branch“ wählen, Branch `main`, Ordner `/ (root)`, **Save**.
5. Nach 1–2 Minuten erscheint oben die Adresse: `https://DEINNAME.github.io/frame-compare/`

## Als App installieren

- **Android (Chrome):** Seite öffnen, Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm“.
- **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“. Danach von dort starten.
- **Laptop (Chrome/Edge):** Installations-Symbol in der Adressleiste.

Nach dem ersten Laden funktioniert die App auch ohne Internet.

## Updates

Geänderte Dateien im Repository erneut hochladen (gleicher Name, „Commit changes“). Die App holt sich die neue Version beim nächsten Start im Hintergrund. Ein Neustart der App genügt in der Regel.

## Datenschutz und Speicher

- Es werden keine Daten an Server gesendet, keine Schriften oder Skripte von Drittanbietern geladen.
- Videos liegen nur im Browser-Speicher des jeweiligen Geräts. Wer die App auf einem anderen Gerät öffnet, sieht sie nicht.
- Löscht man in den Browser-Einstellungen die Website-Daten, sind die Videos weg. Wichtige Videos daher zusätzlich als Original behalten.
- Auf dem iPhone die App zum Home-Bildschirm hinzufügen, das schützt besser vor automatischem Aufräumen durch Safari.

## Für schwache Geräte

- **Sparmodus** (⚙ → „Sparmodus“): schaltet Unschärfe-Effekte aus, begrenzt die Zeichenauflösung und lädt Videos sparsamer. Er ist bei schwächeren Geräten automatisch vorgewählt.
- Kürzere und niedriger aufgelöste Videos (1080p oder weniger) laufen auf älteren Handys deutlich flüssiger.
- Beim Abspielen wartet die App, bis beide Videos ihr Bild haben, statt Bilder zu überspringen oder das Gerät zu überlasten.
