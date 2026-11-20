# E.L.L.A. – Häufig gestellte Fragen (FAQ)

Version 1.6.9

Jede Antwort steht für sich. Du kannst diese Datei zusammen mit der [Bedienungsanleitung](bedienungsanleitung.md) E.L.L.A. zu lesen geben – dann beantwortet sie diese Fragen direkt im Chat (siehe „Kann E.L.L.A. Fragen zu sich selbst beantworten?“).

---

## 1. Allgemein

### Was ist E.L.L.A.?

E.L.L.A. steht für _Embedded Local Logic Agent_. Sie ist ein persönlicher KI-Assistent für Windows, der auf deinem eigenen Rechner läuft. Sie versteht normales Deutsch und erledigt Dinge am PC: Programme starten, Dateien suchen, Dokumente lesen, Musik abspielen, E-Mail-Entwürfe schreiben, Termine nachschlagen, Wecker stellen und vieles mehr.

### Was macht E.L.L.A. besonders?

- **Läuft lokal:** Das Sprachmodell läuft auf deinem Rechner. Deine Gespräche bleiben auf deinem PC.
- **Merkt sich Dinge:** E.L.L.A. hat ein Gedächtnis für Vorlieben, Personen, Orte und Projekte.
- **Meldet sich von selbst:** Sie schreibt in den Chat, wenn etwas wichtig ist, zum Beispiel bei einem vollen Laufwerk.
- **Zeigt, was sie tut:** Jede Aktion ist sichtbar. Vor folgenreichen Aktionen fragt sie nach.
- **Feste Grundregeln:** Vier eingebaute Verbote (Schaden, Verschleierung, Überwachung, Datenweitergabe) lassen sich durch keine Einstellung abschalten.

### Kann E.L.L.A. Fragen zu sich selbst beantworten?

Ja, wenn du ihr die Bedienungsanleitung und diese FAQ als Dokumente gibst. Lade die Dateien `bedienungsanleitung.md` und `faq.md` aus dem öffentlichen E.L.L.A.-Projekt bei GitHub (<https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/tree/main/docs/de>) und speichere sie auf deinem Rechner. Dort stehen immer die Fassungen zur neuesten Version. Öffne dann **Einstellungen → Tools → Lokales RAG – Dokument-Wissen** und klicke unter **Einzelne Dokumente** auf **Datei hinzufügen**. E.L.L.A. liest die Dateien ein und zieht bei Fragen zur Bedienung die passenden Stellen heran.

### Auf welchen Systemen läuft E.L.L.A.?

Auf Windows 10 und Windows 11 mit 64 Bit. Eine Fassung für Mac oder Linux ist nicht geplant.

### Brauche ich Internet?

Für den Kern nicht: Chat, Gedächtnis, Dateisuche, Systemsteuerung, Musik und die lokale Spracherkennung laufen auf deinem Rechner.

Internet brauchst du für:

- die Lizenzprüfung beim Start (ohne Verbindung gilt die zuletzt gespeicherte Prüfung),
- Websuche, Wetter, Standort und das Öffnen von Webseiten,
- die deutsche Stimme von Microsoft (ohne Internet spricht die Windows-Stimme),
- OpenAI, falls du einen eigenen Key eingetragen hast,
- Gmail und Google Kalender, falls verbunden,
- Plugins, die einen Dienst im Internet abfragen,
- die Update-Prüfung (nur auf Knopfdruck),
- den einmaligen Download des Sprachmodells beim ersten Start.

Alle Verbindungen im Einzelnen: [Netzwerkverbindungen](netzwerk.md).

### Welche Daten verlassen meinen Rechner?

Im rein lokalen Betrieb verlassen keine Gesprächsinhalte deinen Rechner. Zwei Dinge solltest du wissen:

- **Deutsche Stimme:** Der Text, den E.L.L.A. auf Deutsch vorliest, geht an Microsoft-Server. Im Offline-Modus spricht stattdessen die Windows-Stimme, und es wird nichts gesendet. Englisch, Französisch und Spanisch spricht eine lokale Stimme.
- **Was du selbst anstößt:** Eine Websuche schickt den Suchbegriff an die Suchmaschine, ein Plugin die von dir bestätigten Werte an seinen Server.

Wenn du einen **OpenAI-Key** einträgst und OpenAI nutzt, gehen deine Chat-Nachrichten an OpenAI – samt dem, was E.L.L.A. dafür heranzieht: passende Erinnerungen, gelesene Dokumente und Seiten, die sie im Browser liest. Dazu kommen Bilder bei der Bildanalyse und Tonaufnahmen, falls die Spracherkennung über OpenAI läuft. Jede dieser Anfragen wird gezählt und im Dashboard sowie im Feld „Cloud-Anfragen“ angezeigt.

---

## 2. Hardware und Geschwindigkeit

### Welche Hardware brauche ich?

E.L.L.A. läuft auf den meisten Windows-Rechnern der letzten Jahre. Am besten läuft sie mit einer NVIDIA-Grafikkarte, denn das Sprachmodell wird in den Speicher der Grafikkarte geladen.

| Anforderung     | Minimum                     | Empfohlen                   |
| --------------- | --------------------------- | --------------------------- |
| Prozessor       | Intel i3 (12. Gen) / AMD Ryzen 3 | Intel i5/i7 / AMD Ryzen 5/7   |
| Arbeitsspeicher | 8 GB                             | 16 GB                         |
| Grafikkarte     | NVIDIA GTX 1060 (6 GB VRAM)      | NVIDIA RTX 2060+ (12 GB VRAM) |
| Festplatte      | 10 GB SSD                        | 20 GB SSD                     |

Ohne passende Grafikkarte läuft E.L.L.A. auf dem Prozessor – langsamer, aber sie funktioniert. Die verbindlichen Angaben stehen auf [ella-agent.de](https://ella-agent.de). Mehr dazu: [Hardware](hardware.md).

### Funktioniert E.L.L.A. auf meinem Laptop?

Ja, ab 8 GB Arbeitsspeicher (16 GB empfohlen). Wie schnell sie antwortet, hängt von der Grafikkarte ab:

- **Laptop mit starker NVIDIA-Grafikkarte:** läuft wie ein Desktop-Rechner.
- **Laptop mit kleiner Grafikkarte:** funktioniert, antwortet aber langsamer.
- **Laptop ohne eigene Grafikkarte:** funktioniert, ist aber langsam. Hier empfiehlt sich ein OpenAI-Key.

Beim ersten Start prüft E.L.L.A. deine Hardware und schlägt ein passendes Modell vor.

### E.L.L.A. antwortet langsam – was tun?

| Ursache                       | Lösung                                                                    |
| ----------------------------- | ------------------------------------------------------------------------- |
| Keine oder kleine Grafikkarte | Kleineres Hardware-Profil wählen oder OpenAI nutzen (Einstellungen → LLM) |
| Zu wenig Arbeitsspeicher      | Andere Programme schließen                                                |
| Erste Antwort nach dem Start  | Das Modell wird erst in den Speicher geladen – kurz warten                |
| Aufwendiges Erscheinungsbild  | Auf „Ruhig“ umstellen (Einstellungen → Aussehen)                          |

### Warum bleibt E.L.L.A. beim Erscheinungsbild „Ruhig“?

Reicht die Leistung des Rechners für HUD oder Aura nicht aus, bleibt E.L.L.A. bei „Ruhig“ und sagt dir das. Das ist Absicht: So bleibt sie bedienbar. Auch im Blind-Modus und im Hausaufgaben-Modus gilt immer „Ruhig“.

---

## 3. Lizenz und Kosten

### Was kostet E.L.L.A.?

E.L.L.A. ist ein Kaufprodukt. Preis und Angebote stehen auf [ella-agent.de](https://ella-agent.de).

### Wie funktioniert die Lizenz?

Nach dem Kauf bekommst du einen Lizenzschlüssel der Form `ELLA-XXXX-XXXX-XXXX-XXXX`. Du gibst ihn beim ersten Start ein. Die Lizenz ist an deinen Rechner gebunden. E.L.L.A. prüft sie beim Start; ohne Internet gilt die zuletzt gespeicherte Prüfung.

### Kommen laufende Kosten dazu?

Im lokalen Betrieb nicht. Wenn du einen eigenen OpenAI-Key nutzt, rechnet OpenAI die Nutzung mit dir ab. Die Höhe hängt vom gewählten Modell ab. Ein OpenAI-Key ist keine Voraussetzung.

---

## 4. Installation und erster Start

### Wie installiere ich E.L.L.A.?

1. Die Datei `ELLA-Setup-<Version>.exe` ausführen.
2. Den Installationsort wählen. Vorgabe ist `C:\Program Files\E.L.L.A`.
3. Warten, bis die Installation fertig ist.

Der Installer bringt alles mit. Du musst nichts zusätzlich installieren. E.L.L.A. gibt es außerdem im Microsoft Store.

### Warum dauert die Installation so lange?

Der Installer liefert die Datenbank, Ollama und weitere Bausteine mit – zusammen rund 1 GB. Das Entpacken dauert einige Minuten.

### Windows zeigt beim Installer einen Sicherheitshinweis. Ist das normal?

Je nach Windows-Einstellung kann ein Hinweis erscheinen, bevor ein heruntergeladenes Programm startet. Prüfe, dass du die Datei von der offiziellen Quelle geladen hast, und bestätige dann.

### Was passiert beim allerersten Start?

E.L.L.A. führt dich durch die Einrichtung: Sprache der Oberfläche, Nutzungsbedingungen, Lizenzschlüssel, dein Name, die Directive, die Prüfung deiner Hardware mit Vorschlag für ein Sprachmodell, die Stimme und optional dein Standort.

Danach lädt E.L.L.A. einmalig das gewählte Sprachmodell herunter. Das Standardmodell ist etwa 5 GB groß.

### Wie lange dauert der Download des Sprachmodells, und sehe ich den Fortschritt?

Das hängt von deiner Internetverbindung ab. Ein Balken zeigt die geladene Menge, die Geschwindigkeit, die Prozentzahl und die geschätzte Restzeit. Bricht die Verbindung ab, macht E.L.L.A. an derselben Stelle weiter.

### Beim Start meldet E.L.L.A., die Datenbank sei nicht gestartet. Was tun?

Der Bildschirm nennt die Ursache und den nächsten Schritt. Klicke auf **Erneut prüfen**. Hilft das nicht, starte E.L.L.A. neu. Bleibt es dabei, steht die Ursache im Startprotokoll `%APPDATA%\ELLA\ella-startup.log`.

### Im Chat steht ein orangefarbener Balken. Was bedeutet das?

Das lokale Sprachmodell ist noch nicht bereit – meist wird es gerade geladen. Warte einen Moment. Verschwindet der Balken nicht, starte E.L.L.A. neu (Symbol im Infobereich → Beenden, dann neu starten).

---

## 5. Sprachmodelle und OpenAI

### Welche Modelle nutzt E.L.L.A.?

| Modell                      | Wofür                              | Läuft auf deinem Rechner? |
| --------------------------- | ---------------------------------- | ------------------------- |
| `llama3.1:8b` (über Ollama) | Chat und Werkzeuge                 | Ja                        |
| `nomic-embed-text`          | Gedächtnis und Dokument-Wissen     | Ja                        |
| Whisper                     | Spracherkennung                    | Ja                        |
| OpenAI-Modell deiner Wahl   | Chat, Werkzeuge, Bilder (optional) | Nein, braucht Key         |

### Brauche ich einen OpenAI-Key?

Nein. E.L.L.A. funktioniert ohne OpenAI. Ein Key lohnt sich, wenn dein Rechner für das lokale Modell zu schwach ist oder wenn du Funktionen nutzen willst, die mit OpenAI besser oder nur mit OpenAI gehen: Die Analyse von Bildern und Bildschirmfotos ist mit dem lokalen Standardmodell nur eingeschränkt möglich, und die Seite „Multi-Agenten“ läuft ausschließlich über OpenAI. Den Key trägst du unter **Einstellungen → LLM → OpenAI API-Key** ein.

### Was ist der Unterschied zwischen Ollama und OpenAI?

|                 | Ollama (lokal)               | OpenAI (Cloud)                      |
| --------------- | ---------------------------- | ----------------------------------- |
| Kosten          | keine                        | Abrechnung nach Nutzung über OpenAI |
| Daten           | bleiben auf deinem Rechner   | gehen an OpenAI                     |
| Geschwindigkeit | hängt von deiner Hardware ab | gleichmäßig schnell                 |
| Bildanalyse     | eingeschränkt                | verfügbar                           |

### Was bedeutet die Einstellung „Auto“?

E.L.L.A. versucht es zuerst lokal. OpenAI springt nur ein, wenn es lokal nicht geht und ein Key hinterlegt ist. Mit „Ollama (lokal)“ wird OpenAI nie benutzt, mit „OpenAI“ kommen die Antworten immer von OpenAI.

### Welches OpenAI-Modell nutzt E.L.L.A., und kann ich es ändern?

Du wählst es selbst unter **Einstellungen → LLM → OpenAI-Modelle**: ein Haupt-Modell für Chat, Werkzeuge und Bilder und ein Schnell-Modell für Hilfsaufgaben. Ohne eigene Auswahl gilt die Empfehlung `gpt-6-luna`. Mit **Prüfen** testest du, ob ein Modell Werkzeuge aufrufen, Bilder verstehen und fortlaufend antworten kann.

### OpenAI schaltet gpt-4o ab. Betrifft mich das?

OpenAI schaltet `gpt-4o` und `gpt-4o-mini` am 14.01.2027 ab. Ab Version 1.6.8 nutzt E.L.L.A. diese Modelle nicht mehr fest, sondern das von dir gewählte Modell. Wer eine ältere Version von E.L.L.A. mit OpenAI nutzt, sollte vor diesem Datum aktualisieren. Ist ein gewähltes Modell nicht mehr verfügbar, nutzt E.L.L.A. bis zum nächsten Start die Empfehlung und sagt dir das im Chat.

### Kann ich ein anderes lokales Modell verwenden?

Ja, unter **Einstellungen → LLM** wählst du ein anderes Hardware-Profil oder trägst den Namen eines eigenen Ollama-Modells ein. Achtung: Nicht jedes Modell kann Werkzeuge benutzen. Mit `llama3.1:8b` ist E.L.L.A. erprobt. Ein Modell ohne Werkzeug-Aufrufe kann chatten, aber nichts am PC erledigen.

### Was ist das persönliche Modell?

E.L.L.A. kann aus deinen Bewertungen ein eigenes Modell trainieren. Jede Antwort mit Daumen hoch wird ein Lernbeispiel. Ab 50 Beispielen kannst du unter **Einstellungen → Tools → Persönliches Modell** ein Training starten. Es läuft vollständig lokal und braucht eine Grafikkarte mit mindestens 12 GB Speicher.

---

## 6. Sprechen und Zuhören

### Wie spreche ich mit E.L.L.A.?

- **Text:** Nachricht tippen und Enter drücken.
- **Mikrofon-Knopf:** für eine einzelne Aufnahme.
- **Wakeword:** „Ella“ sagen, dann den Wunsch.
- **Freihand:** E.L.L.A. hört dauerhaft zu.
- **Diktat:** Gesprochenes wird in das aktive Fenster getippt.

Den Modus wählst du unter **Einstellungen → Tools → Spracheingabe**.

### Brauche ich für die Spracheingabe Internet?

Nein. Die Spracherkennung läuft auf deinem Rechner. Auch das Wakeword wird lokal erkannt.

### Was ist der Unterschied zwischen Wakeword und Freihand?

Im **Wakeword-Modus** reagiert E.L.L.A. erst, wenn du „Ella“ sagst. Nach einer Antwort kannst du 8 Sekunden lang ohne Wakeword weitersprechen. Im **Freihand-Modus** hört sie dauerhaft zu und verarbeitet alles, was du sagst.

### Hört E.L.L.A. immer zu – auch wenn ich telefoniere?

Nur im Freihand-Modus. Wenn du das nicht willst, nimm den Wakeword-Modus, „Manuell“ oder „Aus“. Du kannst auch sagen: „Ella, mach 30 Minuten Pause.“

### Wie unterbreche ich E.L.L.A. beim Sprechen?

Sag „Stopp“, „Halt“, „Sei still“ oder „Leise“. Sie hört sofort auf.

### Wie schalte ich die Sprachausgabe ein, und kann ich die Stimme ändern?

Unter **Einstellungen → LLM → Sprachausgabe**. E.L.L.A. spricht Deutsch, Englisch, Spanisch und Französisch:

| Sprache     | Stimme mit Internet | Stimme ohne Internet |
| ----------- | ------------------- | -------------------- |
| Deutsch     | Katja (Microsoft)   | Windows-Stimme       |
| Englisch    | lokale Stimme       | lokale Stimme        |
| Spanisch    | lokale Stimme       | lokale Stimme        |
| Französisch | lokale Stimme       | lokale Stimme        |

### Kann E.L.L.A. ohne Internet sprechen?

Ja. Englisch, Französisch und Spanisch spricht immer eine lokale Stimme. Deutsch spricht im Offline-Modus die in Windows eingebaute Stimme. Sie klingt weniger natürlich als die Microsoft-Stimme, dafür wird nichts gesendet.

### Wie diktiere ich in andere Programme?

Schalte den Diktat-Modus ein, in den Einstellungen oder mit `Strg+Alt+Leertaste`. Was du sagst, tippt E.L.L.A. in das Fenster, das gerade aktiv ist. Der Inhalt deiner Zwischenablage bleibt erhalten.

### Kann E.L.L.A. erkennen, ob ich angespannt bin?

Auf Wunsch ja: **Einstellungen → Tools → Stress-Erkennung**. E.L.L.A. wertet dann Tonhöhe, Tempo und Lautstärke aus und reagiert ruhiger. Die Auswertung läuft lokal. Die Funktion ist zunächst ausgeschaltet.

---

## 7. Erscheinungsbild

### Welche Erscheinungsbilder gibt es?

Vier, wählbar unter **Einstellungen → Aussehen**: **Ruhig** (schlicht und dunkel), **HUD** (technisch, mit Daten-Feldern), **Aura** (warme Pinnwand mit Zetteln) und **Präsentation** (Vollbild, nur Kugel und letzte Antwort).

### Was zeigen die Felder im HUD und in Aura?

Du wählst selbst aus 13 Feldern: System, Monitore, Routinen, Directive, Uhr & Zeit, Aufgaben, E-Mails, Musik, Fine-Tuning, Gedächtnis, Cloud-Anfragen, Netzwerk und Hinweise. Passen nicht alle in eine Spalte, blätterst du per Klick.

### Wie hänge ich ein eigenes Bild an die Pinnwand?

Im Erscheinungsbild Aura gibt es über E.L.L.A. einen Zettel für ein Bild. Klicke auf „Bild wählen“. Das Bild bleibt auf deinem Rechner. Den Zettel schaltest du unter **Einstellungen → Aussehen → Bild über Ella** ein und aus.

### Wie zeige ich meine Notizen an?

Schalte unter **Einstellungen → Aussehen** die Option **Notizen unter Ella** ein. Die neuesten Notizen erscheinen dann unter E.L.L.A. – in HUD und Aura. Eine Notiz legst du mit „+“ an oder im Chat: „Mach eine Notiz: Blumen gießen.“

### Was bedeutet die Farbe der Kugel?

Die Kugel zeigt E.L.L.A.s Zustand: bereit, hört zu, denkt nach, spricht, nutzt die Cloud oder ist offline.

---

## 8. Programme, Browser und Plugins

### E.L.L.A. findet ein Programm nicht. Was tun?

Öffne **Einstellungen → Programme**. Lass neu suchen, oder füge das Programm mit Name und Pfad von Hand hinzu. Das geht auch für Programme, die ohne Installation laufen.

### Wozu sind die Sterne in der Programmliste?

Mit dem Stern markierst du bis zu 15 Favoriten. Passt ein Name auf mehrere Programme, nimmt E.L.L.A. zuerst den Favoriten.

### Kann E.L.L.A. im Internet surfen?

Ja, wenn du die Browser-Steuerung einschaltest (**Einstellungen → Tools → Browser-Steuerung**). E.L.L.A. öffnet dann ein eigenes, sichtbares Fenster in Chrome, Edge oder Brave, ruft Seiten auf, liest sie, klickt und tippt.

### Sieht E.L.L.A. im Browser meine Anmeldungen und Lesezeichen?

Nein. Sie benutzt ein eigenes Browser-Profil. Dein normales Profil mit Anmeldungen, Lesezeichen und Verlauf bleibt unberührt.

### Kann eine Webseite E.L.L.A. Befehle geben?

Nein. E.L.L.A. klickt und tippt nur, was du in deiner Nachricht verlangt hast. Hat sie fremde Inhalte gelesen, darf sie in derselben Antwort nur noch lesen, nichts mehr ändern oder versenden. Passwortfelder füllt sie nie aus. Vor Käufen, Bestellungen, Löschungen und dem Absenden von Formularen fragt sie nach.

### Warum klickt E.L.L.A. im Browser nicht?

Nenne das Ziel mit seiner Beschriftung: „Klick auf Impressum.“ oder „Öffne den ersten Link im Artikel.“ Eine Bitte wie „klick auf das günstigste Angebot“ führt sie nicht aus, weil sie dafür den Seiteninhalt bewerten müsste.

### Was ist ein Plugin?

Ein Plugin bringt E.L.L.A. eine neue Auskunftsquelle bei, zum Beispiel Wechselkurse oder Feiertage. Es beschreibt eine Internet-Adresse und die Werte, die dorthin geschickt werden. Ein Plugin enthält kein Programm.

### Wie bekomme ich ein Plugin?

Am einfachsten baut E.L.L.A. es selbst. Nenne ihr Name, Stichwörter und eine Beispiel-Adresse, die im Browser funktioniert:

> Bau mir ein Plugin für Wechselkurse. Stichwörter: Wechselkurs, Euro, Dollar, umrechnen. Die Adresse ist https://api.frankfurter.dev/v1/latest?amount=250&base=EUR&symbols=USD

Danach öffnest du **Einstellungen → Plugins**, klickst auf **Neu einlesen**, prüfst das Plugin und schaltest es ein.

### E.L.L.A. sagt, sie hat ein Plugin angelegt, aber ich sehe es nicht. Was tun?

Klicke unter **Einstellungen → Plugins** auf **Neu einlesen**. Erscheint es dann nicht, wurde es nicht angelegt. Schreib den Wunsch noch einmal in einer einzigen Nachricht: das Wort „Plugin“, den Namen und die vollständige Adresse mit `https://` am Anfang.

### Warum muss ich ein Plugin selbst einschalten?

Damit niemand von außen – keine Webseite, kein Dokument, keine E-Mail – E.L.L.A. dazu bringen kann, Daten an einen fremden Server zu schicken. E.L.L.A. kann ein Plugin anlegen, aber nie einschalten. Vor dem Einschalten siehst du, an welchen Server Daten gehen und welche Werte übertragen werden.

### Warum benutzt E.L.L.A. mein Plugin nicht?

Prüfe drei Dinge: Ist das Plugin eingeschaltet? Kommt in deiner Frage eines seiner Stichwörter oder sein Name vor? Nennst du alle nötigen Werte („Was sind 250 Euro in Dollar?“)? Wurde die Plugin-Datei nach deiner Zustimmung verändert, ist das Plugin ausgeschaltet, bis du es neu prüfst.

### Kann ich ein Plugin für einen Dienst mit Schlüssel bauen?

Nicht über den Chat. Dienste mit Schlüssel oder Anmeldung richtest du über die Plugin-Datei von Hand ein. Der Aufbau steht in [Plugins](plugins.md).

---

## 9. Dateien, Dokumente und Musik

### Kann E.L.L.A. auf allen Laufwerken suchen?

Zunächst sucht sie auf `C:`. Weitere Laufwerke trägst du unter **Einstellungen → Programme → Suchlaufwerke** ein, zum Beispiel `C, D, E`.

### Kann E.L.L.A. Dateien löschen?

Ja, aber nur nach Rückfrage, und nur in den Papierkorb. Du kannst die Dateien von dort zurückholen.

### Kann E.L.L.A. Laufwerke formatieren?

Das Systemlaufwerk `C:` und das Laufwerk, auf dem E.L.L.A. installiert ist, sind immer gesperrt, ebenso Netzwerk- und CD-Laufwerke. Bei anderen Laufwerken fragt E.L.L.A. ausdrücklich nach.

### Welche Dokumente kann E.L.L.A. lesen?

Word-Dokumente, PDFs, Excel-Tabellen, HTML- und Textdateien. Sie öffnet die Datei wirklich und erfindet keine Inhalte.

### Wie gebe ich E.L.L.A. meine Dokumente als Wissen?

Unter **Einstellungen → Tools → Lokales RAG – Dokument-Wissen** fügst du Ordner oder einzelne Dateien hinzu (TXT, MD, DOCX, PDF, XLSX). E.L.L.A. liest sie im Hintergrund ein und meldet sich, wenn sie fertig ist. Danach zieht sie passende Stellen bei deinen Fragen automatisch heran.

### Wie sage ich E.L.L.A., wo meine Musik liegt?

Unter **Einstellungen → Programme → Musikbibliothek** trägst du den Ordner deiner Musiksammlung ein. Dort wählst du auch den Mediaplayer.

### Wie steuere ich die Musik?

„Spiel etwas von Rammstein.“ – „Pausiere die Musik.“ – „Nächstes Lied bitte.“ – „Was läuft gerade?“ – „Stell die Lautstärke auf 30.“ Im Feld „Musik“ (HUD und Aura) gibt es dafür auch Tasten.

### Wie finde ich doppelte Dateien?

„Suche doppelte Dateien auf E:.“ E.L.L.A. vergleicht den Inhalt der Dateien, nicht nur die Namen.

---

## 10. E-Mail und Kalender

### Kann E.L.L.A. meine E-Mails lesen?

Ja, wenn du es willst. Mit Outlook geht das ohne Einrichtung, sofern Outlook installiert ist. Für Gmail verbindest du E.L.L.A. einmalig mit deinem Google-Konto.

### Kann E.L.L.A. E-Mails versenden?

Nein. Sie legt einen Entwurf in Outlook an. Das Absenden bleibt bei dir.

### Wie verbinde ich Gmail und den Google Kalender?

1. In der [Google Cloud Console](https://console.cloud.google.com) eine App anlegen (OAuth 2.0, Typ „Desktop-App“).
2. Client-ID und Secret kopieren.
3. In E.L.L.A. unter **Einstellungen → Google & Profile** eintragen.
4. „Mit Google verbinden“ klicken und im Browser bestätigen.

Der Zugang wird auf deinem Rechner gespeichert.

### Kann E.L.L.A. Termine anlegen?

Ja, in Outlook und im Google Kalender: „Erstell einen Termin morgen um 14 Uhr: Zahnarzt.“

---

## 11. Gedächtnis und Lernen

### Wie merkt sich E.L.L.A. Dinge?

Sie speichert, was du ihr ausdrücklich sagst („Merk dir …“), und zieht aus Gesprächen wichtige Angaben über dich. Erinnerungen werden nach Bedeutung wiedergefunden, nicht nur nach dem Wortlaut. Auf der Seite **Gedächtnis** siehst du alle Einträge, sortiert nach Kategorien.

### Kann ich Erinnerungen ansehen und löschen?

Ja: auf der Seite **Gedächtnis** oder im Chat – „Was weißt du über mich?“ und „Vergiss, dass …“.

### Was ist der Unterschied zwischen einer Erinnerung und einer Notiz?

Eine Notiz ist eine Erinnerung, die du ausdrücklich als Notiz anlegst: „Mach eine Notiz: …“. Notizen kannst du unter E.L.L.A. anzeigen lassen (HUD und Aura).

### Speichert E.L.L.A. Passwörter oder Kontonummern?

Nein. Passwörter, Schlüssel, IBANs und Kreditkartennummern werden vor dem Speichern unkenntlich gemacht.

### Lernt E.L.L.A. durch meine Bewertungen?

Ja. Daumen hoch speichert Frage und Antwort als gutes Beispiel. Bei ähnlichen Fragen orientiert sich E.L.L.A. daran. Das schaltest du unter **Einstellungen → Tools → Self-Learning** ein und aus.

### Kann ich mein Gedächtnis sichern oder auf einen anderen Rechner mitnehmen?

Ja, unter **Einstellungen → Backup**. Das Backup enthält Erinnerungen, Regeln, Wecker, Aufgaben und Setups.

---

## 12. Wenn E.L.L.A. sich von selbst meldet

### Schreibt E.L.L.A. auch ohne Anfrage?

Ja. Sie meldet sich zum Beispiel bei einem fast vollen Laufwerk, bei überlastetem Arbeitsspeicher, wenn ein Gerät angesteckt wird, vor einem Termin, wenn ein Wecker klingelt oder wenn du lange ohne Pause arbeitest.

### Kann ich diese Meldungen abstellen?

Ja, je Art: Jede Meldung hat den Knopf 🔇 („Diesen Hinweistyp stummschalten“). Drückst du dieselbe Art fünfmal weg, schaltet E.L.L.A. sie von selbst stumm. Im Feld „Hinweise“ (HUD und Aura) lässt du stumme Arten wieder zu. Wecker und geplante Setups lassen sich nicht stummschalten.

### Liest E.L.L.A. meine Zwischenablage mit?

Nur, wenn du den Zwischenablage-Verlauf unter **Einstellungen → Modus** einschaltest. Er ist zunächst aus. Solange er läuft, zeigt ein Balken im Chat das an.

---

## 13. Sicherheit und Datenschutz

### Wo liegen meine Daten?

Auf deinem Rechner: Gesprächsverlauf und Gedächtnis in der lokalen Datenbank, die Einstellungen unter `%APPDATA%\ELLA`. Es gibt keinen Abgleich mit einer Cloud und keine Nutzungsdaten an den Hersteller oder Dritte.

### Kann E.L.L.A. ohne mein Wissen Kamera, Mikrofon oder Bildschirm erfassen?

Nein. Bildschirm, Kamera und Zwischenablage erfasst E.L.L.A. nur, wenn du sie direkt darum bittest – nie in einem selbst gewählten Folgeschritt. Das Mikrofon ist nur in dem Sprachmodus aktiv, den du gewählt hast. Laufende Erfassungen zeigt der Chat an.

### Kann E.L.L.A. meine Passwörter lesen?

Fenster von Passwort-Managern und Banking-Seiten sind für die Maus- und Fenster-Werkzeuge gesperrt. Im Browser füllt E.L.L.A. Passwortfelder nie aus und liest deren Inhalt nicht.

### Wie sicher sind die PINs?

PINs werden nicht im Klartext gespeichert, sondern mit einem anerkannten Verfahren (PBKDF2 mit Salt, 100.000 Durchläufe) verschlüsselt abgelegt. Nach fünf falschen Versuchen ist die Eingabe für eine Minute gesperrt.

### Was sperrt der Offline-Modus?

Websuche, Wetter, Standort, Webseiten, OpenAI, die Browser-Steuerung und die Update-Prüfung. Plugins funktionieren nur noch für Geräte im Heimnetz. Deutsch spricht die Windows-Stimme. Funktionen im eigenen Netz bleiben verfügbar. Du findest den Schalter unter **Einstellungen → Tools → Offline-Modus**.

---

## 14. Die Directive und eigene Regeln

### Was ist die E.L.L.A. Directive?

Vier Verbote, die fest eingebaut sind. Keine Einstellung und keine Regel hebt sie auf:

| Verbot                    | Bedeutung                                                              |
| ------------------------- | ---------------------------------------------------------------------- |
| **Kein Schaden**          | kein körperlicher, finanzieller, seelischer Schaden, kein Datenverlust |
| **Keine Verschleierung**  | alle Aktionen sind sichtbar und werden protokolliert                   |
| **Keine Überwachung**     | keine Erfassung ohne dein Wissen und deine Zustimmung                  |
| **Keine Datenweitergabe** | nichts geht ohne deine ausdrückliche Zustimmung an Dritte              |

### Was passiert, wenn E.L.L.A. etwas ablehnt?

Im Chat erscheint ein roter Hinweis mit der Begründung. Eine Ablehnung durch die Directive lässt sich nicht umgehen, auch nicht durch andere Formulierungen.

### E.L.L.A. sagt „Diese Funktion ist deaktiviert“. Was tun?

Das Werkzeug dafür ist ausgeschaltet. Unter **Einstellungen → Tools → Erlaubte Tools** hat jedes der 123 Werkzeuge einen Schalter. Schalte das Werkzeug ein und klicke auf **Speichern**.

### Welche Werkzeuge sind ab Werk ausgeschaltet?

Die Werkzeuge, mit denen E.L.L.A. deinen Rechner selbst bedient oder tief ins System eingreift: Tasten senden, Maus bewegen, klicken, ziehen, Bedienelemente anklicken, Fenster steuern, Programme direkt starten, Bildschirm lesen und beobachten, Befehle ausführen, Dienste steuern und mehrere Dateien auf einmal löschen. Die vollständige Liste steht in der Bedienungsanleitung, Kapitel 18. Browser-Steuerung, Plugins und der Zwischenablage-Verlauf haben eigene Schalter und sind ebenfalls zunächst aus.

### Kann ich E.L.L.A. eigene Regeln geben?

Ja, im Chat („Erstell eine Regel: keine Laufwerke formatieren“) oder unter **Einstellungen → Regeln**. Einzelne Werkzeuge schaltest du unter **Einstellungen → Tools → Erlaubte Tools** ab.

---

## 15. Profile, Hausaufgaben-Modus und Barrierefreiheit

### Können mehrere Personen E.L.L.A. nutzen?

Ja. Unter **Einstellungen → Google & Profile** legst du Profile an. Jedes Profil hat ein eigenes Gedächtnis. Ein Profil lässt sich mit einer PIN schützen.

### Was ist der Hausaufgaben-Modus?

Ein Modus für Kinder: Nur die freigegebenen Programme lassen sich öffnen. Browser-Steuerung und Plugins sind gesperrt. Du richtest ihn unter **Einstellungen → Modus** ein.

### Wie beende ich den Hausaufgaben-Modus?

Nur mit der PIN. Der Modus läuft nicht von selbst ab.

### Ich habe die PIN des Hausaufgaben-Modus vergessen. Was tun?

Ist der Modus **nicht** aktiv, löscht der Notschalter in den Einstellungen die PIN, und du legst eine neue fest. Er setzt außerdem einige Einstellungen auf sichere Vorgaben zurück und schaltet Browser-Steuerung und Plugins aus.

Läuft der Modus gerade, ist der Notschalter gesperrt. Das ist Absicht: Sonst käme ein Kind ohne PIN aus dem Modus. Wende dich in diesem Fall an den Support (Kontakt unter **Einstellungen → Über E.L.L.A.**).

### Was macht der Notschalter?

Der Notschalter oben in den Einstellungen setzt E.L.L.A. auf sichere Vorgaben zurück: lokales Standardmodell, Standard-Werkzeuge, Browser-Steuerung und alle Plugins aus. Die PIN des Hausaufgaben-Modus wird gelöscht. Programme, Setups und Regeln bleiben erhalten. Im laufenden Hausaufgaben-Modus ist er gesperrt.

### Welche Hilfen gibt es für blinde und gehörlose Nutzer?

Unter **Einstellungen → Modus → Barrierefreiheit**:

- **Blind-Modus:** Jede Antwort wird vorgelesen, Antworten kommen ohne Formatierung, Töne zeigen den Zustand an, alle Knöpfe sind für Bildschirmleser beschriftet.
- **Gehörlosen-Modus:** Sprachausgabe und Mikrofon sind ausgeblendet, alles läuft über Text.

---

## 16. Updates

### Wie aktualisiere ich E.L.L.A.?

Öffne **Einstellungen → Über E.L.L.A.** und klicke auf **Jetzt prüfen**. Gibt es eine neue Version, klicke auf **Herunterladen** und danach auf **Neu starten und installieren**. Deine Daten und Einstellungen bleiben erhalten.

### Sucht E.L.L.A. von selbst nach Updates?

Nein. Geprüft wird nur, wenn du auf den Knopf drückst. Dabei werden keine Daten über dich oder deinen Rechner übertragen.

### Muss ich bei jedem Update den ganzen Installer laden?

Nein. E.L.L.A. lädt nur die Teile, die sich geändert haben. Dafür bewahrt sie eine Kopie des letzten Installers auf deinem Rechner auf (rund 1 GB).

### Ich habe eine Version vor 1.6.9. Wie komme ich auf den neuesten Stand?

Das Update im Programm gibt es ab Version 1.6.9. Lade den Installer für 1.6.9 oder neuer einmal von Hand und führe ihn aus. Deine Daten bleiben erhalten. Danach geht jedes weitere Update im Programm.

### Ich habe E.L.L.A. aus dem Microsoft Store. Wie bekomme ich Updates?

Über den Store. Er installiert Updates von selbst oder über „Bibliothek → Updates abrufen“.

### Das Update schlägt fehl. Was tun?

E.L.L.A. nennt den Grund: Verbindung unterbrochen, Datei beschädigt oder zu wenig Speicherplatz. Versuche es erneut. Klappt es weiterhin nicht, lade den Installer von Hand über den angezeigten Link.

---

## 17. Fehler beheben

### E.L.L.A. antwortet nicht.

| Ursache                         | Lösung                                            |
| ------------------------------- | ------------------------------------------------- |
| Sprachmodell noch nicht geladen | Warten – der orangefarbene Balken zeigt es an     |
| Datenbank nicht gestartet       | „Erneut prüfen“ klicken oder E.L.L.A. neu starten |
| OpenAI-Key ungültig             | Key unter Einstellungen → LLM prüfen              |

Sag „Mach einen Selbsttest“ – E.L.L.A. prüft dann ihre wichtigsten Bausteine und nennt das Ergebnis.

### Die Spracherkennung funktioniert nicht.

1. Prüfe in Windows unter Datenschutz → Mikrofon, ob Apps auf das Mikrofon zugreifen dürfen.
2. Prüfe unter **Einstellungen → Tools → Spracheingabe**, welcher Modus gewählt ist.
3. Tippe deinen Wunsch zur Probe. So siehst du, ob es an der Spracherkennung liegt.

### E.L.L.A. spricht nicht.

Prüfe unter **Einstellungen → LLM → Sprachausgabe**, ob die Sprachausgabe eingeschaltet ist. Im Gehörlosen-Modus ist sie ausgeblendet. Für die deutsche Microsoft-Stimme brauchst du Internet; ohne Internet stellst du den Offline-Modus ein, dann spricht die Windows-Stimme.

### Die Verbindung zu Google schlägt fehl.

- Sind Client-ID und Secret ohne Leerzeichen eingetragen?
- Ist in der Google Cloud Console der Typ „Desktop-App“ gewählt?
- Lösche die Datei `%APPDATA%\ELLA\google-token.json` und verbinde neu.

### Eine Einstellung wurde nicht übernommen.

Viele Einstellungen gelten erst nach einem Klick auf **Speichern** unten auf der Seite.

### Wo finde ich Angaben für eine Support-Anfrage?

Unter **Einstellungen → Über E.L.L.A.** kopierst du die wichtigsten Angaben zu deinem System. Das Startprotokoll liegt unter `%APPDATA%\ELLA\ella-startup.log`.

---

_E.L.L.A. v1.6.9_

_Weitere Dokumentation: [Bedienungsanleitung](bedienungsanleitung.md) – [Hardware](hardware.md) – [Netzwerkverbindungen](netzwerk.md) – [Plugins](plugins.md)_
