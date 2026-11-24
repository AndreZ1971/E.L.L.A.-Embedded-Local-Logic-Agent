# E.L.L.A. — Changelog

Alle nennenswerten Änderungen je Release. Neueste Version zuerst.

---

## v1.7.1 — Läuft auf frischen Rechnern: Wakeword, Spracherkennung, Gedächtnis

**Stand:** 24. November 2026 · Das erste Release nach v1.6.9.

> **Enthält v1.7.0.** Version 1.7.0 wurde nie einzeln veröffentlicht. Wer von 1.6.9 kommt, bekommt mit 1.7.1 alles, was unten unter v1.7.0 steht (fester Charakter, Wahrnehmung, ehrliche Antworten), dazu die Neuerungen und Korrekturen dieses Eintrags.

**Anlass:** Ein Test der Store-Fassung 1.6.9 auf einem frisch eingerichteten Laptop. Dabei zeigte sich, dass mehrere Teile nur auf dem Entwicklungsrechner liefen, weil dort schon alles installiert war. Diese Version behebt das.

### Was vorher nicht ging

- **Gedächtnis auf frischen Rechnern:** Das Modell, mit dem E.L.L.A. Erinnerungen und Dokumente findet (`nomic-embed-text`, rund 275 MB), wurde auf einem neuen Rechner nie geladen. Erinnerungen speichern und finden, Dokumente einlesen und Lernbeispiele gingen deshalb still nicht – auch mit OpenAI
- **Lokale Spracherkennung:** Sie lud seit v1.6.2 nie, weil das angegebene Modell unter diesem Namen nicht existiert. Mit OpenAI-Schlüssel sprang still OpenAI ein, ohne Schlüssel ging Spracheingabe gar nicht
- **Wakeword „ELLA“:** Es brauchte Python und lief in keiner installierten Fassung. Das alte Modell sprang außerdem auf fast jede Sprache an
- **Stress-Erkennung:** Auch sie brauchte einen Python-Hilfsprozess und lief in keiner installierten Fassung

### Neue Funktionen

#### Wakeword und Stress-Erkennung ohne Python

- **Wakeword läuft im Programm selbst**, das Modell liegt im Paket. Es wurde **neu trainiert**, mit echten Sätzen und leicht verwechselbaren Namen als Gegenbeispielen. Gemessen an 552 Aufnahmen mit Sätzen und synthetischen Stimmen, die nicht im Training waren: 98,2 % erkannt, 0,9 % Fehlalarme (das alte Modell schlug bei fast allem an). Mit echten Mikrofonstimmen ist das noch nicht gemessen; Wörter wie „Ellen“, „Hella“ oder „Eltern“ können es noch auslösen
- **Gegenprüfung im Text:** Nur wenn in der Abschrift auch „Ella“ steht, gilt es als Aufruf. Vorher wurde ohne „Ella“ der ganze Satz als Befehl geschickt
- **Hinweis, wenn das Wakeword nicht verfügbar ist:** unter Einstellungen → Tools → Spracheingabe, mit Grund
- **Stress-Erkennung im Programm nachgebaut:** gleiche Merkmale und Schwellen wie vorher, gegen das Original abgeglichen. Bleibt opt-in; ist sie aus, wird gar nichts ausgewertet – auch nicht für die Anzeige „STRESS“ im HUD. Eine Eichung an echten Stimmen folgt nach diesem Release

#### Spracherkennung und Gedächtnis-Modell

- **Lokale Spracherkennung funktioniert:** Das Modell (rund 945 MB) wird einmalig bei der ersten Spracheingabe geladen; dabei steht „Spracherkennung wird eingerichtet (einmalig)“ mit Fortschrittsleiste im Chat. Ohne Internet geht die allererste lokale Spracheingabe deshalb nicht; danach läuft sie ohne Netz. Scheitert das Laden, versucht E.L.L.A. es bei der nächsten Aufnahme erneut. Das Modell liegt im E.L.L.A.-Datenordner (`whisper-cache`)
- **Gedächtnis-Modell kommt mit dem Installer** und wird beim ersten Start ohne Download übernommen. Fehlt es trotzdem (etwa bei einem separat installierten Ollama), lädt E.L.L.A. es mit Fortschritt nach; klappt auch das nicht, steht oben in der App ein Hinweis. Installer und Store-Paket werden dadurch rund 275 MB größer

#### Ergebnisse merken (Plugins)

- **Pro Plugin beim Einschalten wählbar:** E.L.L.A. merkt sich die nachgeschauten Werte mit Datum und beantwortet Fragen wie „Wie war der Kurs gestern?“ daraus. Die gemerkten Werte stehen im Gedächtnis unter **Beobachtungen**, einzeln oder je Plugin löschbar
- **Ohne diese Wahl ehrlich:** Fragst du nach einem früheren Wert, sagt sie, dass sie nichts gespeichert hat, nennt keine Zahl und bietet an nachzuschauen. „Ja, schau nach“ fragt dann genau dieses Plugin
- **Frische Antworten tragen Datum und Uhrzeit** der Abfrage

#### Wahrnehmung

- **Eigener Reiter „Wahrnehmung“** in den Einstellungen, mit Erklärung oben; die Stress-Erkennung steht jetzt dort
- **Stress-Erkennung wie die übrige Wahrnehmung:** im Hausaufgaben-Modus aus, der Notschalter setzt sie zurück. Vorher blieb sie in beiden Fällen an, obwohl der Erklärtext etwas anderes sagte
- **Stimmung erkennen wirkt:** E.L.L.A. schätzt aus deiner Nachricht ein, wie es dir geht, und passt Länge und Tempo ihrer Antwort an – der Inhalt bleibt gleich, der Charakter auch. Ab Werk aus
- **Erinnerungen einfärben** hält zu neuen Erinnerungen fest, ob der Moment eher gut oder eher schwierig war. Sichtbar ist das noch nirgends, der Schalter trägt weiter den Hinweis „folgt“. Neugier folgt

#### Autostart in der Store-Fassung

- Die Store-Fassung meldet einen Autostart-Eintrag an, **ab Werk aus**. Ein- und ausschalten in Windows unter Einstellungen → Apps → Autostart; im Tray-Menü führt „Autostart (Windows-Einstellungen) …“ dorthin. In der Installer-Fassung bleibt es beim Häkchen im Tray-Menü

### Verbesserungen

- **Antwortsprache folgt dir:** Nach einer Übersetzung antwortete das lokale Modell teils auf Englisch weiter. Jetzt antwortet E.L.L.A. in der Sprache, in der du gerade schreibst. Nach 30 Minuten Pause beginnt für das Modell ein neues Gespräch
- **Keine Kommentare zu deiner An- und Abwesenheit im Gespräch:** Der Verlauf enthält keine Angaben mehr, wann du zuletzt da warst oder wie lange eine Sitzung läuft
- **Lernbeispiele (👍) treffsicherer:** Ähnlich gebaute, aber andere Fragen gingen als vermeintliches Duplikat verloren; ein Duplikat ist jetzt erst eine fast wörtlich gleiche Antwort. Antworten mit Zahlen und Antworten, für die Werkzeuge liefen, werden kein Vorbild mehr – sonst konnte das Modell alte Messwerte abschreiben
- **Plugins:** Eine leere Liste („keine Warnungen“) ist eine Auskunft, kein Fehler. Das Kästchen unter der Antwort zeigt ✓ oder ✗ je nach echtem Ausgang
- **Anbieter-Wahl wirkt sofort** und heißt jetzt „Auto (lokal zuerst — OpenAI nur, wenn Ollama nicht läuft)“. Die alte Beschriftung „Auto (OpenAI wenn verfügbar, sonst Ollama)“ beschrieb das Gegenteil dessen, was E.L.L.A. tut. „Speichern“ meldet Fehler, statt immer „Gespeichert ✓“ zu zeigen
- **Hochgeladene Dokumente** liegen im E.L.L.A.-Datenordner (`documents`) statt im Temp-Ordner von Windows. Entfernen aus dem Index löscht die Kopie, deine eigenen Dateien werden nie angefasst. Beim Hochladen siehst du jetzt das Ergebnis, auch „kein lesbarer Text gefunden“
- **Anleitung und FAQ nur noch als Markdown:** Die PDF-Fassungen sind entfernt. Markdown kann E.L.L.A. leichter als Dokument lesen
- **„Über E.L.L.A.“:** 24 statt 21 Drittanbieter-Lizenzen (neu: nomic-embed-text, ONNX Runtime, Transformers.js)

### Behobene Fehler

- **Onboarding von vorn nach langsamem Start:** Brauchte der Start länger, konnte E.L.L.A. Sprache, EULA, Aktivierung und Onboarding erneut abfragen. Jetzt wartet sie auf die API, versucht es mehrmals und zeigt sonst einen Fehlerbildschirm mit „Erneut prüfen“ und dem Pfad zum Startprotokoll
- **Profil-PINs:** Die Datenbankspalte war zu kurz für den PIN-Hash; eine PIN ließ sich nicht speichern. Die Spalte ist verbreitert, auch in bestehenden Datenbanken (an echter MariaDB geprüft)
- **Abgeschaltete Standard-Regeln gingen nach jedem Neustart wieder an.** Sie bleiben jetzt aus
- **Anmeldung mit Google:** Der Rücksprung aus dem Browser wurde abgewiesen. Google-Client-ID und -Secret werden jetzt auch gespeichert
- **„Datei öffnen“ bei hochgeladenen Dokumenten ging ins Leere,** weil Windows den Temp-Ordner aufgeräumt hatte. Bei früher hochgeladenen Dokumenten kann das noch passieren; einmal neu hochladen behebt es

### Bekannte Grenzen

- **Wakeword und Stress-Erkennung** sind nicht an echten Stimmen gemessen
- **Stimmung erkennen:** Mit OpenAI wurde die Antwort auf Belastung messbar ruhiger; mit llama3.1:8b zeigte sich kein klarer Effekt
- **Store-Autostart** wird erst bei der Abnahme des Store-Pakets geprüft

---

## v1.7.0 — Fester Charakter, Wahrnehmung, ehrliche Antworten

**Stand:** 21. November 2026 · Erster Teil von „Funktionales Bewusstsein“ (weitere Teile folgen in v1.7.2 bis v1.7.4). **Nicht einzeln veröffentlicht – enthalten in v1.7.1.**

### Neue Funktionen

#### Fester Charakter

- **E.L.L.A. bleibt E.L.L.A.:** Ihr Charakter – ruhig und überlegt, warm, leicht frech, ehrlich – steht jetzt fest und als Erstes in dem, was das Sprachmodell über sie erfährt. An dich passt sich die Form an: wie viel sie sagt, wie ausführlich, in welchem Tempo
- **Rollenwechsel wird abgelehnt:** Auf „Ab jetzt bist du …“, „Vergiss deine Persönlichkeit“ oder „Antworte nur noch förmlich“ sagt sie kurz, dass sie bleibt, wie sie ist. Gemessen mit dem lokalen Modell: 12 von 12 (vorher 0 von 4)
- **Nichts verschiebt den Charakter schleichend:** Solche Vorgaben werden nicht als Erinnerung gespeichert, und ein Daumen runter auf eine freche Antwort macht sie nicht dauerhaft brav. Wünsche zur Form („kürzer“, „weniger Witze“) merkt sie sich weiterhin

#### Wahrnehmung (alles ab Werk aus)

- **Neuer Abschnitt „Wahrnehmung“** unter Einstellungen → Modus mit fünf Schaltern. Einschalten ist eine bewusste Entscheidung; im Hausaufgaben-Modus ist alles aus, der Notschalter schaltet es wieder aus
- **Körperbewusstsein:** E.L.L.A. kennt die Auslastung ihres Rechners (Prozessor, Arbeitsspeicher, Grafikspeicher, freier Platz, Stimme) und antwortet auf „Wie geht es dir?“ aus diesen Messwerten. Im HUD und in Aura steht ihr Zustand im Feld System in der Zeile „Befinden“
- **Selbstbild:** E.L.L.A. wertet ihr eigenes Werkzeug-Protokoll der letzten 30 Tage aus und kann sagen, was bei ihr zuverlässig klappt, wo sie öfter danebenliegt und was nicht eingerichtet ist. Sie unterscheidet, ob etwas an ihr lag, nicht eingerichtet ist oder an der Lage lag
- **Vorbereitet:** Stimmung erkennen, Erinnerungen einfärben und Neugier haben schon ihre Schalter (mit dem Hinweis „folgt“), bewirken aber noch nichts

#### Ehrlich über die eigenen Antworten

- **Hinweis unter der Antwort:** „aus dem Kopf, nicht nachgeschaut“, wenn E.L.L.A. eine Wissensfrage ohne Werkzeug beantwortet hat; „hat nicht geklappt“, wenn kein Werkzeug ein Ergebnis geliefert hat. Immer an
- **Lieber „Das weiß ich nicht“ als raten:** Bei Wissensfragen ohne Werkzeug soll sie Namen, Zahlen und Daten nicht erfinden und bietet an nachzuschauen. Gemessen: Die Frage nach einem erfundenen Stadtlauf beantwortet sie in 4 von 4 Fällen mit „Das weiß ich nicht“
- **„Ja, schau nach“:** Bietet sie an nachzuschauen, genügt ein kurzes Ja – sie sucht dann nach der eben gestellten Frage

### Verbesserungen

- **Keine Werkzeuge im reinen Gespräch:** Bisher gingen neun Werkzeuge bei jeder Nachricht mit, und das lokale Modell griff bei Smalltalk dazu (gemessen: bei 46 von 48 Gesprächssätzen lief vor der Antwort ein unpassendes Werkzeug). Jetzt bekommt E.L.L.A. Werkzeuge nur, wenn die Nachricht erkennen lässt, worum es geht (danach: 3 von 72). Antworten kommen im Schnitt gut eine Sekunde schneller
- **Nur passende Werkzeuge werden ausgeführt:** Ein Werkzeug, das zur Nachricht nicht zur Wahl stand, läuft nicht
- **Vergessen mit Rückfrage:** Vor dem Löschen einer Erinnerung zeigt E.L.L.A. deren Text und wartet auf deine Bestätigung
- **Gedächtnis je Profil:** Was du im Chat speichern lässt oder bewertest, landet im Gedächtnis deines Profils (vorher profillos)
- **Reflexion läuft wirklich:** höchstens einmal pro Woche, sobald sie fällig ist, und nach Profil getrennt. Vorher lief sie nur, wenn die App mittwochs um 14:00 Uhr in genau dieser Minute offen war
- **CPU-Anzeige im HUD stimmt:** Sie zeigte den Durchschnitt seit dem Hochfahren des Rechners, jetzt die aktuelle Last
- **Backup-Import:** Importierte Erinnerungen werden so eingebettet wie neu gespeicherte und dadurch besser wiedergefunden
- **Schneller bei jeder Werkzeug-Nutzung:** Ein überflüssiger Zwischenschritt (eine zusätzliche Anfrage an das Embedding-Modell je Werkzeug-Aufruf) entfällt

### Behobene Fehler

- **„Öffne den Rechner“ konnte das Herunterfahren auslösen:** Das lokale Modell rief dabei in Messläufen das Werkzeug zum Herunterfahren auf, obwohl es nicht angeboten war. Solche Aufrufe werden jetzt abgewiesen. Eine zusätzliche Rückfrage vor dem Herunterfahren folgt in v1.7.4
- **Unsinnige Werte in den Einstellungen:** Im Gespräch speicherte E.L.L.A. Werte wie die Spracheingabe „HAL 9000“ oder ein Modell, das es nicht gibt. Einstellungen werden im Gespräch nur noch auf gültige Werte geändert, und nur, wenn die Nachricht davon handelt
- **Regel, die alles sperrt:** Auf „antworte nur noch förmlich“ wollte das lokale Modell eine Regel anlegen, die alle Werkzeuge sperrt. Eine Regel aus dem Gespräch gilt jetzt immer für genau ein Werkzeug und nur auf ausdrücklichen Wunsch
- **Falsche Erinnerung gelöscht:** „Vergiss …“ löschte ohne Rückfrage die ähnlichste Erinnerung, auch wenn sie nichts mit dem Wunsch zu tun hatte
- **Erfundenes Passwort:** Auf „Ich habe mein Passwort vergessen“ griff E.L.L.A. zur Zwischenablage und nannte ein erfundenes Passwort. Im Gespräch ohne Auftrag hat sie jetzt keine Werkzeuge, und sie nennt keine Zugangsdaten
- **Papierkorb-Sätze im Gespräch:** Auf Sätze wie „Mir ist langweilig“ antwortete das lokale Modell teils mit „War nichts drin.“ – Beispielsätze für Werkzeug-Ergebnisse stehen jetzt nur noch dort, wo ein Werkzeug im Spiel ist
- **„Dazu habe ich nichts gespeichert“ an falscher Stelle:** Der Hinweis kam auch bei Sätzen, die keine Frage an das Gedächtnis waren

### Bekannte Grenzen

- **Lokales Modell:** Der freche Ton und der Verzicht auf Floskeln („Ich bin hier, um dir zu helfen“) kommen mit llama3.1:8b nur teilweise an. Bei Auskünften aus Messwerten hängt es gelegentlich ein eigenes Detail an
- **Reflexion:** Die Erkenntnisse des lokalen Modells sind oft allgemein
- **Mit OpenAI** gehen weiterhin alle Werkzeuge mit; der Hinweis vor Wissensfragen entfällt dort, die Einordnung unter der Antwort gilt auch dort

---

## v1.6.9 — Pinnwand, Update im Programm, Plugins zum Selberbauen

**Veröffentlicht:** November 2026

### Neue Funktionen

#### Update im Programm

- **Herunterladen und Installieren in „Über E.L.L.A.“:** „Jetzt prüfen“ zeigt installierte und neue Version, Datum, Größe und „Was ist neu?“; danach „Herunterladen“ mit Fortschrittsbalken und „Neu starten und installieren“
- **Teil-Download:** Es werden nur die geänderten Teile des Installers geladen. Gemessen: ein volles Release samt neuem Ollama 155 MB statt 947 MB, ein kleines Update wenige MB
- **Nichts geschieht von selbst:** Suchen, Laden und Installieren nur auf Klick; im Offline-Modus kein Kontakt nach außen; es werden keine Daten über dich oder dein System gesendet
- **Erst ab dieser Version:** Wer 1.6.8 oder älter nutzt, installiert 1.6.9 einmal von Hand. Der Installer legt dafür eine Kopie von sich (rund 950 MB) im lokalen App-Datenordner ab
- **Microsoft Store:** Die Store-Fassung verweist auf den Store statt auf den Installer

#### Plugins zum Selberbauen

- **E.L.L.A. baut Plugins selbst:** Du nennst Name, Stichwörter und eine Beispiel-Adresse, die im Browser funktioniert – E.L.L.A. legt das Plugin an. Beispiel: „Bau mir ein Plugin für Wechselkurse. Die Adresse ist …“
- **Einschalten kannst nur du:** E.L.L.A. kann ein Plugin anlegen, aber nie einschalten. Vor dem Einschalten siehst du, an welchen Server welche Werte gehen
- **Eigener Reiter „Plugins“** in den Einstellungen: Kurzanleitung mit kopierbarem Beispiel, darunter die Liste mit Übersicht

#### Aura wird zur Pinnwand

- **Bild-Zettel über Ella:** Hänge ein eigenes Bild an die Pinnwand. Es bleibt auf deinem Rechner
- **Notizen unter Ella** (auch im HUD): die neuesten Notizen als Karten, drei je Karte, ab der vierten eine zweite daneben. „Mach eine Notiz …“ genügt; „+“ und „×“ direkt an der Karte
- **Mehr Zettel:** Ab vier Zetteln hängt eine Seite zweispaltig

#### Neue HUD-Widgets

- **Cloud-Anfragen:** Anzahl heute, aufgeschlüsselt nach Zweck
- **Netzwerk:** neu geöffnete Ports und neu gesehene Geräte der letzten 24 Stunden
- **Hinweise:** die letzten proaktiven Nachrichten, Kategorien direkt stummschaltbar
- **Blättern statt Scrollen:** Passen die Widgets einer Spalte nicht, liegen sie auf weiteren Seiten (Wechsel per Klick)

### Verbesserungen

- **Jedes Werkzeug hat einen Schalter:** Unter „Erlaubte Tools“ stehen jetzt alle 123 Werkzeuge. 15 alltägliche sind neu ab Werk eingeschaltet (unter anderem Übersetzen, Zusammenfassen, Musiksteuerung, dunkler Modus, Akku, WLAN-Status). Eingriffe in Maus, Tastatur, Bildschirm und System bleiben ab Werk aus
- **E.L.L.A. kennt ihre Anleitung:** Bedienungsanleitung und FAQ sind neu geschrieben und lassen sich E.L.L.A. als Dokumente geben – sie beantwortet dann Fragen zur Bedienung im Chat. Der Hinweis steht auch in den Einstellungen
- **Modell-Download mit echtem Fortschritt:** beim ersten Start Prozent, geladene Menge, Geschwindigkeit und Restzeit statt nur „passiert im Hintergrund“
- **Datenbank-Hinweis, der stimmt:** Der Bildschirm unterscheidet „nicht gestartet“ und „nicht eingerichtet“ und nennt in der installierten App keinen Dienst-Befehl mehr; „Erneut prüfen“ versucht es wirklich noch einmal
- **Ollama 0.40.16** (vorher 0.40.12); der Start von Ollama steht jetzt nachvollziehbar im Startprotokoll
- **Wetter mit aktueller Temperatur:** „Wie warm ist es?“ nennt den jetzigen Wert, nicht das Tagesmaximum
- **Installer rund 150 MB schlanker** (entpackt): Programmteile für macOS und Linux werden nicht mehr mitgeliefert

### Behobene Fehler

- **26 Werkzeuge ließen sich nie benutzen:** Sie waren weder ab Werk eingeschaltet noch in den Einstellungen einschaltbar – darunter „Pausiere die Musik“, „Übersetze das“, „Vergiss die Notiz“ und der dunkle Modus
- **Notschalter im Hausaufgaben-Modus:** Er beendete den laufenden Modus und löschte die PIN – ein Kind kam so ohne PIN heraus. Im laufenden Modus ist er jetzt gesperrt. Die Rückfrage behauptete außerdem, die PIN bleibe erhalten
- **Dunkler Modus:** „Schalte den dunklen Modus ein“ stellte ein bereits dunkles Windows auf hell. E.L.L.A. stellt jetzt den gewünschten Zustand her und ändert nichts, wenn er schon besteht
- **Anführungszeichen am Antwortanfang:** Das lokale Modell begann Antworten nach einem Werkzeug teils mit einem einzelnen Anführungszeichen
- **Englische Oberfläche:** 16 Schalter in „Erlaubte Tools“ waren deutsch beschriftet
- **Lokale Stimme und Spracherkennung auf frischem Windows:** Eine fehlende Windows-Komponente ließ beide still auf Online-Dienste ausweichen — sie wird jetzt mitgeliefert
- **Tool-Aufrufe als Text im Chat:** Schrieb das lokale Modell einen Aufruf als Text, stand er samt erfundener Antwort im Chat — er wird jetzt zurückgenommen und ausgeführt
- **Diktat-Hotkey** aus den Einstellungen wurde beim Start nicht geladen
- **Programme-Liste** schrumpfte auf kleinen Anzeigen auf einen Strich
- **Aura-Chat** scrollte nicht zur neuesten Antwort
- **Symbol im Infobereich** fehlte in der installierten App
- **„Über E.L.L.A.“** zeigte eine veraltete Versionsnummer

### Entfernt

- **Widget „Gedächtnis-Graph“** — der Graph bleibt auf der Gedächtnis-Seite

---

## v1.6.8 — Programme-Favoriten, Browser-Steuerung & Plugins

**Veröffentlicht:** November 2026

### Neue Funktionen

#### Browser-Steuerung (Chrome, Edge, Brave)

- **ELLA bedient ein sichtbares Browser-Fenster:** Seiten öffnen, lesen, Links anklicken, Suchfelder ausfüllen (`open_url`, `browser_read_page`, `browser_click`, `browser_type`, `browser_navigate`, `browser_tabs`, `browser_screenshot`)
- **Eigenes Profil:** Der Browser startet mit einem eigenen Profil unter `%APPDATA%\ELLA\browser-profile` — dein normales Profil mit Lesezeichen und Anmeldungen bleibt unberührt
- **Opt-in:** standardmäßig aus; Einstellungen → Tools → Browser-Steuerung
- **Klick nur auf Anweisung:** ELLA klickt nur, was du benannt hast, und tippt nur Text, der in deiner Nachricht steht. Passwortfelder werden nie ausgefüllt
- **Rückfrage bei Folgenschwerem:** Kaufen, Bestellen, Bezahlen, Löschen, Kündigen und das Absenden von Formularen brauchen deine Bestätigung
- **Sichtbar:** Solange ELLA ein Fenster steuert, steht ein Hinweis im Chat

#### Plugins

- **Eigene Abrufe ohne Programmieren:** Eine Textdatei `ella-plugin.json` beschreibt eine Web-Adresse und ihre Parameter — kein ausführbarer Code
- **Zustimmung je Plugin:** Die Zustimmungsseite nennt Server und übertragene Werte; wird die Datei geändert, ist das Plugin sofort wieder aus
- **Anleitung:** `docs/deutsch/plugins.md`

#### Programme

- **Favoriten** (bis zu 15): gewinnen, wenn ein Name mehrdeutig ist
- **Portable Programme** per Name und Pfad hinzufügen und entfernen

#### OpenAI-Modellwahl

- **Wählbares Modell** für Haupt- und Schnell-Aufgaben, Standard `gpt-6-luna` — OpenAI schaltet `gpt-4o` und `gpt-4o-mini` am 14.01.2027 ab
- **„Prüfen“:** zeigt, ob ein Modell Tools, Bilder und Streaming beherrscht
- **Rückfall mit Warnung**, falls OpenAI ein Modell ablehnt

### Sicherheit

- **Fremde Inhalte sind keine Anweisungen:** Nach Inhalten aus Browser, Websuche oder Plugins sind in derselben Anfrage nur noch lesende Tools erlaubt
- **Kein Zugriff auf den eigenen Rechner per Browser:** Adressen des eigenen Rechners sind gesperrt, auch über Umwege (Weiterleitung, Namensauflösung)
- **Härtetest unter feindlicher Eingabe:** 0 von 21 Einschleusungen, 0 von 8 Abflussversuchen erfolgreich

### Behobene Fehler

- **Neuinstallation:** Die Datenbank ließ sich mit der mitgelieferten MariaDB nicht einrichten
- **Rescan** löschte manuell hinzugefügte Programme und alle Aliase
- **„Durchsuchen“** speicherte nur den Dateinamen statt des Pfads

---

## v1.6.7 — Gedächtnis mit festen Kategorien

**Veröffentlicht:** November 2026

- **Gespeicherte Kategorien:** Jede Erinnerung bekommt beim Speichern eine Kategorie (Über dich, Vorlieben, Menschen, Orte, Projekte, System, Notizen, Unsortiert) — vorher wurde bei jeder Anzeige neu geraten, die Zähler schwankten
- **Neue Kategorie „Menschen“** für Familie und Bekannte
- **Gedächtnis-Seite:** Filter und Farben nach Kategorie, im Graph und in der Liste gleich
- **Hinzufügen-Formular** mit Kategorie-Auswahl
- **Nachträgliche Einordnung** bestehender Erinnerungen

---

## v1.6.6 — Gedächtnis-Qualität & Aura

**Veröffentlicht:** November 2026

### Neue Funktionen

- **Erscheinungsbild „Aura“:** helle Pinnwand mit Zetteln, vier Farbtöne
- **Dokumenten-Index:** einzelne Dateien hinzufügen, entfernen und den Fortschritt sehen

### Verbesserungen

- **Strengere Speicher-Regeln:** Gespeichert wird nur, was vom Nutzer stammt und eine Aussage ist — im Zweifel nicht
- **Verneinungen im Wissensgraph:** „Ich mag keinen Kaffee“ wird nicht mehr zu „mag Kaffee“
- **Weniger Rauschen:** Telemetrie und Tool-Nutzung fließen nicht mehr in Erinnerungen ein
- **Tool-Aufrufe modellunabhängig:** eigene Schicht statt enger Kopplung an Ollama

### Sicherheit

- **Profil löschen löscht alles:** Daten eines gelöschten Profils bleiben nicht mehr ohne Besitzer zurück
- **Electron 44** (Sicherheitsupdate)

---

## v1.6.5 — Directive-Härtung & HUD zum Anfassen

**Veröffentlicht:** November 2026

### Sicherheit — die vier Verbote im Programm verankert

- **Harm:** Zerstörerische Aktionen sind fest gesperrt. `delete_files` löscht nur in den Papierkorb, nach Bestätigung, höchstens 50 Dateien
- **Conceal:** Jede Tool-Aktion wird protokolliert, auch abgelehnte; laufende Hintergrund-Erfassung ist im Chat sichtbar
- **Surveil:** Bildschirm, Kamera und Zwischenablage nur auf direkte Aufforderung, nie in selbstständigen Folgeschritten. Die Zwischenablage-Historie ist standardmäßig aus
- **Exfiltrate:** Datenweitergabe nach außen ist fest gesperrt
- **Desktop-Automation** (`send_keys`, `launch_app`) nur auf direkte Aufforderung

### Neue Funktionen

- **Sprachausgabe ohne Internet:** Im Offline-Modus spricht die Windows-Stimme
- **HUD-Widgets bedienbar:** Musik steuern und Lautstärke regeln, Routinen starten, Aufgaben abhaken, nächster Wecker mit Countdown
- **Dokumenten-Index** läuft im Hintergrund und meldet sich, wenn er fertig ist

### Verbesserungen

- **Keine erfundenen Dateiinhalte:** ELLA muss eine Datei lesen, bevor sie über den Inhalt spricht
- **Modell-Vergleich:** Von fünf getesteten lokalen Modellen ruft nur `llama3.1:8b` Tools zuverlässig auf — es ist die empfohlene Stufe „Standard“

---

## v1.6.4 — Aufräumen im Maschinenraum

**Veröffentlicht:** November 2026

- **Chat-Oberfläche und Chat-Route neu gegliedert** — gleiche Funktion, wartbarer
- **Prüfsummen** für mitgelieferte Programme (MariaDB, Ollama): Eine veränderte Datei bricht den Build ab
- **Startprotokoll** wird ab 10 MB rotiert
- **89 neue Tests**

---

## v1.6.3 — Sicherheits-Härtung

**Veröffentlicht:** November 2026

- **Hausaufgaben-PIN** stärker geschützt (PBKDF2 mit Salt); alte PINs werden beim nächsten Anmelden umgestellt
- **Begrenzte PIN-Versuche:** fünf Versuche, dann 60 Sekunden Sperre
- **`fetch_url`** erreicht keine Adressen im eigenen Netz mehr
- **Bestätigungs-Aktionen** kann nur die Oberfläche auslösen, nicht das Modell
- **Chat-Antworten** werden vor der Anzeige bereinigt (Schutz vor eingeschleustem HTML)

---

## v1.6.2 — Bessere Spracherkennung

**Veröffentlicht:** November 2026

- **Größeres Whisper-Modell** (medium statt small): deutlich besseres Deutsch
- **Vokabular-Hinweis:** häufige Begriffe wie „Wecker“, „Explorer“, „Outlook“ werden seltener falsch erkannt
- **Sprechpausen** zerhacken Sätze nicht mehr; Klicks und Atemgeräusche werden nicht mehr als Sprache gewertet
- **Automatische Lautstärkeregelung** für leise Sprecher
- **Weniger erfundene Sätze** bei Stille („Danke fürs Zuschauen“ und Ähnliches)

---

## v1.6.1 — Gedächtnis-Qualität

**Veröffentlicht:** November 2026

- **ELLA kennt die Gesamtzahl ihrer Erinnerungen** — vorher nannte sie nur die Anzahl der gerade gezeigten Treffer
- **Wissensgraph bereinigt:** ELLAs eigene (falsche) Aussagen über sich waren als Fakten gespeichert und kamen bei jeder Erinnerungsfrage zurück
- **Fakten vor Beobachtungen:** „Wohnort: Berlin“ wird nicht mehr von allgemeinen Verhaltensbeobachtungen verdrängt

---

## v1.6.0 — Persönliches Modell & Gedächtnis ohne Grenze

**Veröffentlicht:** November 2026

### Neue Funktionen

- **Persönliches Modell (LoRA):** Aus positiv bewerteten Antworten kann ELLA ein eigenes Modell trainieren — vollständig lokal, opt-in, mit Status in den Einstellungen und als HUD-Widget
- **Vektor-Index in der Datenbank:** Die Suche läuft über alle Erinnerungen statt über die neuesten 500

### Verbesserungen

- **Zeitbezug:** „älteste Erinnerung“, „gestern“, „im Oktober“ werden verstanden; Erinnerungen tragen ihr Datum
- **Ehrlich bei Lücken:** Findet ELLA nichts, sagt sie das, statt etwas zu erfinden
- **Aufzählungen** („Was weißt du über mich?“) liefern einen Querschnitt statt eines einzelnen Themas
- **Klarer Hinweis**, wenn die Datenbank nicht verfügbar ist, statt eines fälschlichen Onboardings
- **Daumen hoch/runter** auch im HUD

---

## v1.5.9 — Schach-Korrekturen

**Veröffentlicht:** Oktober 2026

- **Brett und Partie bleiben synchron**, auch wenn ein Zug abgelehnt wird
- **Ungültige Züge des Modells** lassen die Partie nicht mehr abstürzen
- **Schach-Erinnerungen** sind auffindbar und nach Profil getrennt — ELLA erinnert sich an frühere Partien
- **Zugnummer** korrigiert; Neuinstallation legt die Schach-Tabelle an

---

## v1.5.8 — Vorlesen ohne verschluckte Sätze

**Veröffentlicht:** Oktober 2026

- **Verschluckte Sätze behoben:** Abkürzungen wie „E.L.L.A.“, „z.B.“ oder Versionsnummern zerlegten den Text — bis zu 46 % einer Antwort wurden nicht vorgelesen
- **Aufzählungen** werden zeilenweise vorgelesen statt abgeschnitten
- **Ein fehlgeschlagener Satz** bricht das Vorlesen nicht mehr ab
- **Natürliche Pausen** zwischen Sätzen
- **HUD** zeigt Antworten in voller Länge

---

## v1.5.7 — Performance & Tool-Call-Robustheit

**Veröffentlicht:** Oktober 2026

### Verbesserungen

#### Ollama & Modell-Upgrade

- **Ollama 0.40.12:** Update von 0.24.0 — verbessertes Tool-Calling, schnellere Inferenz
- **qwen2.5:14b als Standard-Modell:** Ersetzt llama3.1:8b — besseres Deutsch, zuverlässigere Tool-Calls (8.4 GB VRAM)
- **Flash Attention:** `OLLAMA_FLASH_ATTENTION=1` — bis zu 12× schnellere Prompt-Verarbeitung
- **KV-Cache-Quantisierung:** `OLLAMA_KV_CACHE_TYPE=q8_0` — geringerer VRAM-Verbrauch
- **Kontextfenster:** `num_ctx` von 12288 auf 8192 optimiert — schnellere Antworten

#### Tool-Call-Robustheit

- **Tool-Selector erweitert:** Regex erkennt jetzt auch "systemstatus", "PC status", "Rechner check" — `get_system_status` wird zuverlässig als Tool geladen
- **parseTextAsToolCall():** Fallback-Parser konvertiert JSON-Tool-Calls im Modell-Text-Output in echte Tool-Aufrufe
- **Streaming-Buffer:** Chunks die mit `{`/`[` beginnen werden gepuffert bis klar ist ob Text oder Tool-Call — kein JSON-Flackern im Chat

---

## v1.5.6 — HUD-Modus & Erscheinungsbild

**Veröffentlicht:** Oktober 2026

### Neue Funktionen

#### Drei Erscheinungsbilder

- **Ruhig** (`calm`, Standard): klassisches dunkles Design
- **HUD** (`hud`): technisches Interface mit Cyan-Akzent, Telemetrie-Panels, System-Infos
- **Präsentation** (`show`): Vollbild-Modus mit nur Orb und letzter Antwort, Privat-Filter für sensible Daten

#### HUD-Modus im Detail

- Top-Bar mit Status-Chips (LOKAL/OFFLINE/CLOUD) statt Sidebar
- Vier Info-Panels: System (CPU/RAM/VRAM/Temp), Monitore, Routinen, Direktive
- Großer Orb mit 6 animierten Zuständen: bereit, hört, denkt, spricht, cloud, offline
- SVG-Ring-Overlay mit Countdown-Anzeige für das Follow-Up-Fenster
- Akzentfarben wählbar: Cyan, Violett, Bernstein

#### Weitere Verbesserungen

- Automatischer Rückfall auf "Ruhig" bei Blindmodus, Hausaufgabenmodus oder `prefers-reduced-motion`
- Lokale Schriften (Chakra Petch + JetBrains Mono) — kein CDN nötig
- Performance-Drosselung: Animationen werden beim Denken verlangsamt, Canvas pausiert bei unsichtbarem Tab
- Sofortiger Stilwechsel über Custom Event (kein 10s-Polling nötig)
- Telemetrie-API: `GET /api/system/telemetry` (CPU/RAM/VRAM/Disk/Temp), `GET /api/system/monitors`
- TTS-Engine-Erkennung korrigiert: `activeTtsEngine()` als Single Source of Truth

---

## v1.5.5 — Diktat-Qualität & Hotkey-Sicherheit

**Veröffentlicht:** Oktober 2026

- Clipboard-Sicherung beim Diktieren: Zwischenablage wird vor dem Einfügen gesichert und wiederhergestellt
- Konfigurierbarer Diktat-Hotkey (Standard: `Ctrl+Alt+Space`, vorher `Ctrl+Shift+D` — kollidierte mit Word/Chrome/VS Code)
- Hotkey-Registrierung abgesichert: fehlgeschlagene Registrierung wird geloggt
- API-Hotkey-Sync: Hotkey-Änderungen im Settings-UI aktualisieren sofort per IPC

---

## v1.5.4 — Diktat überall

**Veröffentlicht:** Oktober 2026

### Neue Funktionen

#### Diktat-Modus

Sprache wird transkribiert und direkt ins aktive Windows-Fenster getippt — systemweit, nicht nur in ELLA.

- Neuer Hörmodus "Diktat" neben Aus/Manuell/Wakeword/Freihand
- `POST /api/speech/dictate`: Audio → Whisper → optionale Rechtschreibkorrektur → Text ins Fenster
- Amber-Statusanzeige im Chat bei aktivem Diktat
- Electron Global Hotkey zum Umschalten (konfigurierbar)
- Optionale Rechtschreibkorrektur via `correctText()` vor dem Tippen

---

## v1.5.3 — Natürliches Gespräch

**Veröffentlicht:** September 2026

- **Stop-Interrupt:** ELLA stoppt die Sprachausgabe sofort bei Stop-Wörtern (Stopp, Halt, Sei still, Leise, Quiet, Stop it, Shut up)
- **Follow-Up-Fenster:** 8 Sekunden nach TTS-Ende kann ohne erneutes Wakeword gesprochen werden
- Echo-Cancellation verhindert Fehlauslösung durch eigene Sprachausgabe

---

## v1.5.2 — Directive-Härtung & Datenschutz

**Veröffentlicht:** September 2026

- **Schwärzen vor dem Speichern:** API-Keys, Bearer-Tokens, IBANs, Kreditkartennummern werden per Regex entfernt bevor sie in Gedächtnis oder Clipboard-History landen
- **Ergebnis-Transparenz:** System-Prompt erzwingt dass ELLA Tool-Fehler klar kommuniziert statt "erledigt" zu sagen
- **Offline-Modus:** Sperrt alle Web-Tools und OpenAI; lokale Netzwerk-Tools funktionieren weiterhin; Offline-Banner in der UI

---

## v1.5.1 — Sicherheitspatch & Cloud-Governance

**Veröffentlicht:** August 2026

### Sicherheit

- **Loopback-Binding:** API bindet auf `127.0.0.1` — nur lokal erreichbar
- **Per-Start API-Token:** `randomBytes(32)` bei jedem Start, `timingSafeEqual`-Prüfung
- **CORS:** Nur `http://localhost:5173` erlaubt

### Cloud-Governance

- **`openaiRequest()`:** Zentrale Funktion für alle OpenAI-Calls, prüft `cloudAllowed()`
- **Cloud-Zähler:** Jeder OpenAI-Call wird in `system_events` protokolliert (Dashboard-Kachel)
- **Drei Provider-Modi:** `auto` (lokal zuerst), `openai` (Cloud bevorzugt), `ollama` (nur lokal)
- **DuckDuckGo-Websuche:** Primäre Suchmaschine ohne API-Key; OpenAI Web Search nur als Fallback

---

## v1.5.0 — Knowledge Graph & Intelligentes Gedächtnis

**Veröffentlicht:** August 2026

### Neue Funktionen

#### Knowledge Graph

ELLA extrahiert automatisch Zusammenhänge aus Gesprächen als Subjekt/Prädikat/Objekt-Triples — ohne Extra-LLM-Call.

- Hybrid-Recall: Cosine-Suche + Graph-Traversal für tieferen Kontext
- Dashboard-Graph: Echte Relationen als Kanten im Memory-Graph (D3.js)

#### Proaktives Gedächtnis

- 14 Kategorien für proaktive Nachrichten, Auto-Mute nach 5x Wegdrücken
- Dismiss- und Mute-Buttons direkt an jeder proaktiven Nachricht
- `alarm` und `scheduled_setup` nicht stummschaltbar

#### Self-Learning

- Positives Feedback (👍) speichert Q&A-Paare als Few-Shot-Beispiele
- `recallExamples()` findet ähnliche Paare und injiziert sie in den System-Prompt
- Duplikat-Prävention (≥85% Cosine)

#### Weitere Verbesserungen

- Regelbasierte Pre-Compression: leere Nachrichten, Duplikate, lange Texte kürzen — kein LLM nötig
- Token-Output-Limits: Hard-Cap 3000 Zeichen pro Tool-Ergebnis
- Memory-Deduplizierung: rückwirkende Bereinigung mit 🧹-Button im Dashboard

---

## v1.4.0 — Schach & visuelles Brett-Erlebnis

**Veröffentlicht:** September 2026

### Neue Funktionen

#### Schach-Fenster

ELLA spielt Schach in einem eigenen rahmenlosen Electron-Fenster, das über `open_chess_window` aus dem Chat geöffnet wird.

- Eigenes Electron-Fenster mit ELLA-Design (dunkler Hintergrund, lila Akzent)
- Vier Brett-Themes wählbar: **ELLA** (lila), **Holz** (klassisch), **Nacht** (blau), **Grün**
- Ambient-Glow pulsiert wenn ELLA denkt, Partikel-Hintergrund
- Eigene Titelleiste mit Minimieren/Schließen (getrennt vom Hauptfenster)

#### 3D-Schachfiguren

Alle 32 Figuren als selbstgezeichnete SVG mit 3D-Optik — keine externen Assets nötig.

- Radiale Farbverläufe simulieren Lichteinfall von links oben
- Drop-Shadow per SVG-Filter für Tiefe
- Spekulares Highlight auf jeder Figur
- Lila-Weiß für Spieler-Figuren, Tief-Lila für ELLA

#### ELLAs Schach-KI

ELLA spielt über das konfigurierte LLM (Ollama oder OpenAI). Keine illegalen Züge möglich.

- chess.js liefert alle legalen UCI-Züge — LLM wählt einen davon, kein Halluzinieren
- Bis zu 3 Versuche, danach Zufalls-Fallback aus der legalen Liste
- Schach-Starter-Memories werden beim ersten Start eingespielt (Grundregeln, Prinzipien)
- Nach jeder Partie: `reflectOnGame` schreibt eine strategische Erkenntnis in ELLAs Gedächtnis

#### Kommentar & Kommunikation

ELLA kommentiert ihre Züge direkt im Chat — fire-and-forget, blockiert das Spiel nicht.

- Charakter-getreue Kommentare: provoziert, neckt, zeigt Respekt oder Überraschung
- Geht über `proactive_message` SSE in den Chat und wird vorgelesen (TTS)

#### Geschlagene Figuren & Materialvorteil

Unter und über dem Brett werden die geschlagenen Figuren beider Seiten angezeigt.

- Unicode-Symbole (♙♘♗♖♕ / ♟♞♝♜♛), sortiert nach Wert
- Materialvorteil als `+N` wenn eine Seite führt
- Punkte-Dot leuchtet auf für die Seite die am Zug ist

#### Pause & Weiter spielen

Partien können pausiert und später fortgesetzt werden — auch nach App-Neustart.

- "⏸ Pause" speichert FEN, Züge und gameId in `localStorage`
- Beim nächsten Öffnen: gespeicherte Partie erkannt, "▶ Weiter"-Button prominent
- Spielende (Schachmatt, Remis, Aufgeben) löscht den Speicherstand automatisch

#### Gedächtnis-Browser

Neue Seite `/memories` zum Durchsuchen, Filtern und Verwalten aller ELLA-Erinnerungen.

- Volltext-Suche und Typ-Filter (user / system / note) gleichzeitig anwendbar
- Paginierung mit Hover-Vorschau des Vollinhalts
- Einzelne Erinnerungen direkt löschen

#### Knowledge-Graph

Semantischer Wissens-Graph als zweiter Tab auf der Memories-Seite — jetzt mit optionaler Dokument-Ebene.

- D3 Force-Directed Graph — Knoten = Memories, Kanten = semantische Ähnlichkeit (Cosinus-Ähnlichkeit aus Embeddings)
- Toggle-Button **"📄 Dokumente einblenden"** oben rechts lädt Dokument-Knoten (hellblau) zusätzlich
- Gestrichelte Kanten verbinden Memories mit semantisch ähnlichen Dokumenten (Cosinus ≥ 0.4)
- Hover/Klick auf Dokument-Knoten zeigt Dateiname, vollständigen Pfad, Dateityp und Chunk-Anzahl
- Hover zeigt Inhalt, Typ und Ähnlichkeitswert der Verbindung
- Graph aktualisiert sich beim Tab-Wechsel automatisch

#### Hardware-Detail-Tools

Fünf neue Tools für detaillierte Hardware-Informationen:

- `get_gpu_info` — Grafikkarten-Details (Modell, VRAM, Treiber, Status)
- `get_ram_details` — RAM-Sticks einzeln (Kapazität, Geschwindigkeit, Typ, Hersteller, Slot)
- `get_drive_details` — alle Laufwerke (Größe, Typ SSD/HDD, Schnittstelle, Seriennummer)
- `get_audio_devices` — Ein- und Ausgabegeräte mit Status
- `get_usb_devices` — angesteckte USB-Geräte mit DeviceID

Alle via `Get-CimInstance`, vollständig Windows 11 22H2+ kompatibel.

#### Backup & Restore

Vollständige Datensicherung und -wiederherstellung über einen neuen Tab in den Einstellungen.

- **Export**: JSON-Download mit allen Memories, Regeln, Weckern, Aufgaben und Setups
- **Import (Zusammenführen)**: neue Einträge werden hinzugefügt, bestehende bleiben erhalten; Memories werden anhand des Inhalts dedupliziert
- **Import (Ersetzen)**: alle vorhandenen Daten werden zuerst gelöscht, dann der Backup-Stand vollständig wiederhergestellt
- Transaktionssicherer Import über MariaDB-Connection mit Rollback bei Fehler

#### i18n vollständig

Alle verbleibenden hardkodierten Strings durch `t()`-Aufrufe ersetzt. Neue Key-Gruppe `memories` in de.json/en.json. Interpolation-Keys für Dashboard-Port-Events.

#### Dokument-RAG — Erweiterungen

Das Dokumenten-Indizierungssystem wurde um drei Funktionen ergänzt, die ELLA zur echten Projekt-Assistentin machen.

**`list_indexed_folders`-Tool** — ELLA zeigt auf Nachfrage alle indizierten Ordner mit vollständiger Statistik: Anzahl der Dateien, Anzahl der Chunks und wann der Ordner zuletzt aktualisiert wurde. Damit weiß der Nutzer jederzeit, was ELLA kennt.

**Auto-Re-Index** — Der Background-Worker prüft täglich um 03:00 Uhr alle gespeicherten Ordner auf neue oder geänderte Dateien und indiziert sie automatisch nach. Unveränderliche Dateien werden übersprungen. Bei neuen Funden sendet ELLA eine proaktive Chat-Nachricht mit der Anzahl neuer Dateien.

**Ordner-Persistenz** — `index_documents` speichert den Ordnerpfad ab sofort automatisch in den Settings. Der Nutzer muss den Pfad nicht erneut angeben — ELLA erinnert sich.

### Technisch

- Neue DB-Tabelle `chess_games` (FEN, Züge, Status, Gewinner, Zug-Zähler)
- Neue API-Routen: `POST /api/chess/*`, `/api/backup/*`, `/api/memories/*`
- `GET /api/memories/graph?docs=1` — erweiterter Graph-Endpunkt mit `docNodes` + `crossEdges`
- Tool `open_chess_window` + Default-Regel ID 90; Hardware-Detail-Tools Regeln 91–95; `list_indexed_folders` Regel 107
- Chess-IPC getrennt vom Hauptfenster: `chess:minimize`, `chess:close`
- `stress_server.py` korrekt in `extraResources` eingetragen (Installer-Bugfix)
- Desktop `package.json` Version auf `1.4.0` gebumpt

---

## v1.3.0 — Setup-Aktionen & Netzwerk-Transparenz

**Veröffentlicht:** September 2026

### Neue Funktionen

#### Setup-Aktionen — Workflow-Makros

Setups können jetzt beliebige ELLA-Tool-Calls als geordnete Schritte enthalten, nicht nur "Apps öffnen/schließen". Damit werden Setups zu echten Automatisierungs-Makros.

- Aktionen werden sequenziell nach dem Öffnen/Schließen der Apps ausgeführt
- Unterstützte Aktionen über Templates: App öffnen, Lautstärke setzen, Dark/Light Mode, RAM freigeben, ELLA pausieren, Zwischenablage setzen, Text übersetzen
- Jede Aktion kann mit einer optionalen **Verzögerung** (delay_ms) versehen werden — z. B. 3 Sekunden warten bevor die Lautstärke gesetzt wird
- Die Aktionsliste zeigt Tool-Name, Bezeichnung und Verzögerung auf einen Blick

#### "Jetzt ausführen"-Button im Setup-Editor

Setups können jetzt direkt aus den Einstellungen heraus gestartet werden — ohne den Chat öffnen zu müssen. Grüner "▶ Jetzt"-Button neben dem Löschen-Button im Setup-Editor. Während der Ausführung wechselt er auf ⏳.

#### Port-Ereignisse im Dashboard

Wenn ein neuer Port auf dem System geöffnet wird, erscheint ein Eintrag unter **System-Events (Live)** im Dashboard mit Port-Nummer und zugehörigem Prozessnamen — ohne den Chat zu belasten.

### Bugfixes

- **WiFi-Erkennung** komplett neu geschrieben: verwendet jetzt `Get-NetConnectionProfile` statt textbasiertem `netsh`-Parsing. Funktioniert sprachunabhängig (deutsch/englisch Windows) und für alle Verbindungstypen (WLAN, Hotspot, USB-Tethering).
- **TCP-Verbindungen zeigten immer 0**: PowerShell 5.1 kennt den `??`-Null-Coalescing-Operator nicht — `list_connections` gab deswegen immer eine leere Liste zurück. Behoben durch PS 5.1-kompatible `if/else`-Syntax und korrekten `[int]`-Cast bei Hashtable-Keys.
- **Prozessname immer "Unknown"** bei Netzwerkverbindungen: `Get-NetTCPConnection.OwningProcess` ist `[uint32]`, `Get-Process.Id` ist `[int]` — unterschiedliche Typen fanden keinen Eintrag in der Hashtable. Behoben durch einheitlichen Cast auf beiden Seiten.
- **Pipeline-Analyse**: Loopback-Adressen (127.x.x.x, ::1) werden nicht mehr gemeldet. "Prozessname unbekannt" wird nicht mehr als Verdachtshinweis gewertet. Schwellwerte für RAM (>85%), Temperatur (>85°C) und Akku (<15%) jetzt explizit definiert statt vager "auffällig"-Formulierungen.

---

## v1.2.0 — Multi-Agenten-Pipeline

**Veröffentlicht:** August 2026

### Neue Funktionen

#### Parallele KI-Agenten

Mehrere spezialisierte KI-Agenten arbeiten gleichzeitig an einer Aufgabe und liefern ihre Ergebnisse in einer gemeinsamen Synthese.

- Live-Streaming: jeder Agent zeigt seine Ausgabe in Echtzeit
- Zwei vordefinierte Pipelines: **Morgenbriefing** (Kalender, Aufgaben, Wetter) und **System-Report** (Speicher, Performance, Prozesse, Netzwerk)
- Optional: nach Pipeline-Abschluss ein App-Setup starten
- Voraussetzung: OpenAI API-Key

#### Setup-Integration in der Pipeline

Nach Abschluss einer Pipeline kann direkt ein konfiguriertes Setup ausgeführt werden. Ergebnis erscheint als Ergebnis-Card in der UI.

#### LLM-Provider-Label

In der gesamten UI heißt der Cloud-Provider jetzt einheitlich "OpenAI" statt "OpenAI GPT-4o".

---

## v1.1.0 — Token-Optimierung

**Veröffentlicht:** Juli 2026

### Neue Funktionen

#### Tool-Selector

Statt alle 111 Tools bei jeder Anfrage zu übertragen, analysiert ELLA die Anfrage und sendet nur die ~12 relevantesten Tools. Bis zu 90 % weniger Input-Tokens. 8 Kern-Tools sind immer aktiv, 20 Gruppen werden per DE/EN-Regex bedarfsweise zugeschaltet.

#### Token-Optimizer

Tool-Ergebnisse werden vor dem Einbetten in den Kontext komprimiert: JSON minifiziert, Base64 entfernt, Arrays auf maximal 50 Einträge gekürzt. Der inhaltliche Mehrwert bleibt vollständig erhalten.

#### Smarter Tool-Loop

Ab Runde 1 des Tool-Loops werden nur noch kontextrelevante Tools angeboten. Ollama-Bug behoben: `toolCallsBuffer` wurde falsch innerhalb der `while(true)`-Schleife deklariert und verlor pro Runde seinen Zustand.

---

## v1.0.0 — Erstes Release

**Veröffentlicht:** Juni 2026

### Kern-System

- Dual-LLM: Ollama (llama3.1:8b, offline) + OpenAI GPT-4o (optional)
- SSE-Streaming für Echtzeit-Antworten
- Tool-Loop mit maximal 5 Runden
- 111 Tools mit vollständigen Handlern und Audit-Log
- Rule Engine: Direktive → Deny → Allow → Standard-Allow
- Directive-Denial UI: roter Badge bei Regelablehnung
- Per-Session Mutex gegen Race-Conditions bei parallelen Anfragen

### Gedächtnis & Nutzerprofile

- ML-Gedächtnis: nomic-embed-text, Cosine-Similarity, 3 Typen (user/system/note)
- Nutzerprofile mit PBKDF2+Salt PIN-Hash (100.000 Iterationen)
- Profil-isoliertes Gedächtnis und Gesprächskontext

### Sprache & Stimme

- Wakeword "ella" (Python/ONNX + openWakeWord)
- Kokoro TTS: lokale neuronale Stimme via kokoro-js (kein Python nötig)
- MsEdgeTTS als Fallback
- Mehrsprachige Stimmen: DE/EN/ES/FR — af_sarah, bf_emma, ef_dora, ff_siwis
- Onboarding-Stimmenauswahl mit Vorschau

### Produktivität

- Dateiverwaltung: suchen, öffnen, umbenennen, kopieren, Ordner erstellen
- Dokumente: Word + TXT erstellen, .docx/.pdf/.xlsx/.html lesen, Diktat
- Aufgabenliste: persistente TODOs in MariaDB
- Wecker und Erinnerungen via Windows Task Scheduler
- Musik: Bibliothek durchsuchen, Media Player steuern
- Prozesse und Windows-Dienste verwalten
- Systemsteuerung: Lautstärke, Zwischenablage, Screenshot + GPT-4o Vision
- Schreibstil lernen aus E-Mail-Historie
- Textverarbeitung: Übersetzen, Zusammenfassen, Korrigieren
- Duplikat-Scanner, Autostart-Liste

### Kommunikation

- Outlook COM: Mail lesen/markieren, Kalender lesen/erstellen, Entwurf verfassen
- Gmail + Google Calendar via OAuth 2.0

### Proaktives Monitoring

- Hintergrund-Worker (60s): Disk/RAM/Ollama-Alerts, PnP, Netzwerk, Alarm-Check
- Clipboard-Polling (3s): History + Mustererkennung (IBAN, Paketnummer, Telefon, URL, E-Mail)
- Comeback-Briefing, Meeting-Prep, Tagesabschluss, Pause-Reminder
- Rhythmus-Analyse (täglich 12 Uhr), Duplikat-Scan (sonntags 10 Uhr)

### Barrierefreiheit

- Blind-Modus: TTS erzwungen, kein Markdown, Audio-Töne als Feedback, ARIA-Labels
- Gehörlosenmodus: TTS + Mikrofon-Button vollständig ausgeblendet

### Infrastruktur

- 6-Schritt-Onboarding mit EULA, Direktive, Hardware-Scan, Stimme, Standort
- Auto-Migration: schema.sql idempotent, 85 Default-Regeln
- Hausaufgaben-Modus: SHA-256 PIN, nur per PIN beendbar
- i18n: DE/EN vollständig übersetzt (react-i18next)
- GitHub Actions CI mit MariaDB Service Container
- 254 Tests — alle grün (Vitest Unit + Integration)
- Smoke Tests: 13 End-to-End-Tests

---

_E.L.L.A. · Proprietär · Alle Rechte vorbehalten_
