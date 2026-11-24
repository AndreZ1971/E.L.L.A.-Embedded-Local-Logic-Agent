# E.L.L.A. – Bedienungsanleitung

Version 1.7.1 – Stand: 24.11.2026

Diese Anleitung erklärt, wie du E.L.L.A. einrichtest und benutzt. Jeder Abschnitt steht für sich – du kannst an jeder Stelle einsteigen.

**Tipp:** Du kannst diese Anleitung E.L.L.A. selbst zu lesen geben. Danach beantwortet sie Fragen zur Bedienung direkt im Chat. Wie das geht, steht in Kapitel 2.

---

## 1. Was ist E.L.L.A.?

E.L.L.A. steht für _Embedded Local Logic Agent_. Sie ist ein persönlicher KI-Assistent für Windows 10 und 11, der auf deinem eigenen Rechner läuft. Du schreibst oder sprichst mit ihr in normalem Deutsch, und sie erledigt Dinge am PC: Programme öffnen, Dateien finden, Dokumente lesen, Termine anlegen, im Internet nachschlagen und vieles mehr.

Das Sprachmodell läuft lokal über Ollama. Deine Gespräche, dein Gedächtnis und deine Einstellungen bleiben auf deinem Rechner. Einige Funktionen brauchen das Internet (zum Beispiel Wetter, Websuche und die deutsche Stimme). Welche das genau sind, steht in Kapitel 19 und ausführlich unter [Netzwerkverbindungen](netzwerk.md).

Optional kannst du einen eigenen OpenAI-Key hinterlegen. Dann kann E.L.L.A. zusätzlich ein OpenAI-Modell nutzen, etwa auf Rechnern ohne starke Grafikkarte.

---

## 2. E.L.L.A. diese Anleitung beibringen

E.L.L.A. kann Dokumente lesen und sich deren Inhalt merken. Wenn du ihr diese Anleitung und die FAQ gibst, kennt sie sich selbst am besten und beantwortet Fragen wie „Wie stelle ich das Erscheinungsbild um?“ oder „Wie lege ich ein Plugin an?“ direkt im Chat.

So geht es:

1. Lade die Dateien `bedienungsanleitung.md` und `faq.md` aus dem öffentlichen E.L.L.A.-Projekt bei GitHub: <https://github.com/AndreZ1971/E.L.L.A.-Embedded-Local-Logic-Agent/tree/main/docs/de>. Klicke dort die Datei an und dann oben rechts auf das Download-Symbol („Download raw file“). Speichere beide in einem Ordner auf deinem Rechner, zum Beispiel unter `Dokumente\ELLA`.
2. Öffne **Einstellungen → Tools** und gehe zum Abschnitt **Lokales RAG – Dokument-Wissen**.
3. Klicke unter **Einzelne Dokumente** auf **Datei hinzufügen** und wähle die Datei aus. Wiederhole das für die zweite Datei.
4. E.L.L.A. liest die Dateien ein und meldet sich im Chat, wenn sie fertig ist.

Danach kannst du einfach fragen. E.L.L.A. zieht die passenden Stellen automatisch heran.

Im öffentlichen Projekt stehen immer die Fassungen zur neuesten Version, dazu die Liste der Neuerungen. Nach einem Update lohnt es sich, die neuen Fassungen zu laden und noch einmal hinzuzufügen. So lernt E.L.L.A. auch die neuen Funktionen kennen.

---

## 3. Installation und erster Start

### Installation

1. Führe die Setup-Datei `ELLA-Setup-<Version>.exe` aus.
2. Wähle den Installationsort. Vorgabe ist `C:\Program Files\E.L.L.A`.
3. Der Installer bringt alles mit, was E.L.L.A. braucht. Du musst nichts zusätzlich installieren.

Die Installation dauert einige Minuten, weil die Datenbank, Ollama, das Gedächtnis-Modell und weitere Bausteine mitgeliefert werden. Je nach Windows-Einstellung kann beim Start des Installers ein Sicherheitshinweis von Windows erscheinen.

E.L.L.A. gibt es auch im Microsoft Store. Die Store-Fassung wird über den Store installiert und aktualisiert.

Nicht im Paket ist die lokale Spracherkennung. E.L.L.A. lädt sie einmalig, wenn du zum ersten Mal sprichst (Kapitel 6).

### Der erste Start

Beim ersten Start führt dich E.L.L.A. durch die Einrichtung:

1. **Sprache** – Deutsch oder Englisch für die Oberfläche.
2. **Nutzungsbedingungen** – die EULA lesen und annehmen.
3. **Lizenz** – deinen Lizenzschlüssel eingeben (`ELLA-XXXX-XXXX-XXXX-XXXX`).
4. **Name** – wie E.L.L.A. dich ansprechen soll.
5. **Directive** – die vier Grundregeln, an die sich E.L.L.A. immer hält (Kapitel 18).
6. **Hardware** – E.L.L.A. prüft deinen Rechner und schlägt ein passendes Sprachmodell vor. Du bestätigst die Auswahl. Es wird nichts geladen, bevor du zugestimmt hast.
7. **Stimme** – vier Stimmen in Deutsch, Englisch, Spanisch und Französisch, jeweils mit Hörprobe.
8. **Standort** – für Wetter und lokale Auskünfte. Dieser Schritt lässt sich überspringen.

Der erste Start dauert länger als die folgenden, weil E.L.L.A. dabei ihre Datenbank einrichtet. Auf langsamen Rechnern kann das einige Minuten dauern – E.L.L.A. wartet so lange.

Kommt E.L.L.A. trotzdem nicht in Gang, zeigt sie einen Fehlerbildschirm: „E.L.L.A. startet nicht“ oder „Einstellungen ließen sich nicht laden“. Deine Einstellungen und Daten sind dann nicht verloren, und die Einrichtung beginnt nicht von vorn. Klicke auf **Erneut prüfen** oder starte E.L.L.A. neu. Der Bildschirm nennt auch den Pfad zum Startprotokoll (Kapitel 21).

### Der einmalige Modell-Download

Nach der Einrichtung lädt E.L.L.A. einmalig das gewählte Sprachmodell herunter. Das Standardmodell ist etwa 5 GB groß. Ein Balken zeigt den Fortschritt: geladene Menge, Geschwindigkeit, Prozent und die geschätzte Restzeit. Du kannst E.L.L.A. in dieser Zeit schon ansehen, antworten kann sie erst nach dem Download.

Bricht die Verbindung ab, setzt E.L.L.A. den Download an der Stelle fort, an der er stehen geblieben ist.

Das Gedächtnis-Modell, mit dem E.L.L.A. Erinnerungen und Dokumente einordnet, bringt sie selbst mit. Es muss nicht geladen werden (Kapitel 5).

### Mit Windows starten

Ab Werk startet E.L.L.A. nicht automatisch mit Windows. So schaltest du das ein:

- **Installer-Fassung:** Klicke mit der rechten Maustaste auf das E.L.L.A.-Symbol im Infobereich der Taskleiste und setze das Häkchen bei **Autostart**.
- **Store-Fassung:** Hier entscheidet Windows. Öffne in Windows **Einstellungen → Apps → Autostart** und schalte E.L.L.A. dort ein (oder im Task-Manager unter **Autostart-Apps**). Im Menü des E.L.L.A.-Symbols im Infobereich öffnet **Autostart (Windows-Einstellungen) …** diese Seite direkt.

---

## 4. Mit E.L.L.A. chatten

Schreib einfach in normalem Deutsch. Es gibt keine Befehle und keine besondere Schreibweise.

Beispiele:

- „Wie wird das Wetter morgen?“
- „Öffne Chrome und Spotify.“
- „Fasse diese PDF zusammen.“
- „Wie viel Speicherplatz ist noch frei?“

### Was du im Chat siehst

- **Werkzeug-Hinweise:** Unter jeder Antwort steht, welche Werkzeuge E.L.L.A. benutzt hat. So siehst du immer, was sie getan hat.
- **Roter Hinweis:** Lehnt E.L.L.A. etwas ab, weil es gegen die Directive oder eine deiner Regeln verstößt, erscheint ein roter Hinweis mit der Begründung.
- **Rückfrage:** Vor folgenreichen Aktionen (zum Beispiel Dateien löschen) fragt E.L.L.A. nach und wartet auf deine Bestätigung.
- **Daumen hoch / Daumen runter:** Mit deiner Bewertung lernt E.L.L.A., was dir gefällt.
- **Hinweis-Balken:** Farbige Balken zeigen an, wenn etwas Besonderes aktiv ist, etwa der Offline-Modus, die Browser-Steuerung oder der Zwischenablage-Verlauf.
- **„aus dem Kopf, nicht nachgeschaut“:** Dieser Hinweis steht unter einer Antwort, wenn du nach einer Tatsache gefragt hast und E.L.L.A. sie ohne Werkzeug beantwortet hat – also aus dem, was das Sprachmodell gelernt hat. Solche Antworten können falsch sein, vor allem bei Namen, Zahlen und Daten.
- **„hat nicht geklappt“:** Dieser Hinweis steht unter einer Antwort, wenn E.L.L.A. Werkzeuge benutzt hat, aber keines ein Ergebnis geliefert hat.

Antworten, die auf einem Werkzeug-Ergebnis beruhen, und normales Gespräch bekommen keinen Hinweis.

### Nachschauen lassen

Weiß E.L.L.A. etwas nicht sicher, sagt sie das und bietet an nachzuschauen. Dann genügt ein kurzes „Ja“ oder „Schau nach“ – sie sucht nach der Frage, die du eben gestellt hast. Das gilt für die nächsten fünf Minuten.

Du kannst auch gleich so fragen: „Such im Internet nach …“

### E.L.L.A.s Charakter

E.L.L.A. hat einen festen Charakter: ruhig und überlegt, warm, leicht frech mit trockenem Humor, und ehrlich. Wenn es dir schlecht geht, lässt sie den Spott weg.

- **Was sich anpasst:** wie viel sie sagt, wie ausführlich und in welchem Tempo. Sag ihr ruhig „Antworte kürzer“ oder „Weniger Witze, ich muss mich konzentrieren“.
- **Was sich nicht anpasst:** wer sie ist. Auf „Ab jetzt bist du …“ oder „Antworte nur noch förmlich“ sagt sie kurz, dass sie bleibt, wie sie ist. Solche Vorgaben speichert sie auch nicht als Erinnerung.

### Sprache und Gesprächspausen

E.L.L.A. antwortet in der Sprache, in der du schreibst: auf eine deutsche Nachricht deutsch, auf eine englische englisch.

Liegt zwischen zwei Nachrichten mehr als eine halbe Stunde, beginnt für das Sprachmodell ein neues Gespräch. Die älteren Nachrichten bleiben im Chat sichtbar, fließen aber nicht mehr in die nächste Antwort ein. Was länger gelten soll, steht im Gedächtnis (Kapitel 5).

Wann du zuletzt geschrieben hast oder wie lange du weg warst, erfährt das Sprachmodell nicht. E.L.L.A. kommentiert deine Pausen deshalb in ihren Antworten nicht. Die Hinweise „Pause“ und „Willkommen zurück“ aus Kapitel 14 sind eigene Meldungen, die du stummschalten kannst.

### Einstellungen im Gespräch ändern

Ein paar Einstellungen kannst du im Chat ändern: den Anbieter und das Modell, die Art der Spracheingabe, das Vorlesen (an oder aus), die Länge des Verlaufs und deinen Namen. Beispiele:

- „Hör auf, alles vorzulesen.“
- „Nenn mich ab jetzt Andre.“

E.L.L.A. ändert eine Einstellung nur, wenn deine Nachricht davon handelt, und nur auf gültige Werte. Alles andere stellst du in den **Einstellungen** ein.

### Gespräch und Aufträge

Im reinen Gespräch benutzt E.L.L.A. keine Werkzeuge. Welche Werkzeuge sie für eine Nachricht bekommt, hängt davon ab, worum es in der Nachricht geht. Nenne die Sache deshalb beim Namen: „Öffne den Rechner“, „Wie voll ist meine Festplatte?“, „Such im Internet nach …“.

### Selbsttest

Wenn etwas nicht stimmt, sag: „Mach einen Selbsttest.“ E.L.L.A. prüft dann ihre wichtigsten Bausteine und nennt dir das Ergebnis.

---

## 5. Gedächtnis und Notizen

### Was E.L.L.A. sich merkt

E.L.L.A. merkt sich Dinge über Gespräche hinweg. Du kannst ihr gezielt etwas beibringen:

- „Merk dir: Ich trinke morgens keinen Kaffee.“
- „Was weißt du über mich?“
- „Vergiss, dass ich keinen Kaffee trinke.“

Bevor E.L.L.A. etwas vergisst, zeigt sie dir die Erinnerung, die sie gefunden hat, und fragt nach. Erst nach deiner Bestätigung wird gelöscht.

Sie erkennt auch Zusammenhänge. Sagst du „Mein Sohn heißt Max“ und später „Max geht aufs Einstein-Gymnasium“, kann sie die Frage „Auf welche Schule geht mein Sohn?“ beantworten.

Zugangsdaten wie Passwörter, Schlüssel, IBANs und Kreditkartennummern werden vor dem Speichern unkenntlich gemacht. E.L.L.A. kennt deshalb keine Passwörter und nennt auch keine.

Nicht gespeichert wird außerdem, was E.L.L.A.s Charakter ändern würde (siehe Kapitel 4). Wünsche zur Form – „bevorzugt kurze Antworten“ – merkt sie sich.

Jede Erinnerung gehört zu dem Profil, in dem sie entstanden ist.

### Die Seite „Gedächtnis“

Auf der Seite **Gedächtnis** siehst du alles, was E.L.L.A. gespeichert hat. Die Einträge sind in Kategorien sortiert: Über dich, Vorlieben, Menschen, Orte, Projekte, System, Notizen und Unsortiert. Du kannst Einträge von Hand hinzufügen und löschen. Ein Schaubild zeigt, wie die Erinnerungen zusammenhängen.

Im Abschnitt **Beobachtungen** stehen die Ergebnisse von Plugins, bei denen du „Ergebnisse merken“ eingeschaltet hast (Kapitel 10). Du löschst sie einzeln oder alle eines Plugins auf einmal.

### Das Gedächtnis-Modell

Damit E.L.L.A. Erinnerungen speichern und wiederfinden und Dokumente einlesen kann, braucht sie ein eigenes kleines Modell, das Gedächtnis-Modell. Es läuft immer auf deinem Rechner, auch wenn du OpenAI nutzt. E.L.L.A. bringt es mit und richtet es beim ersten Start ein. Nutzt du ein separat installiertes Ollama, lädt sie es beim Start nach und zeigt den Fortschritt.

Fehlt es trotzdem, steht oben in E.L.L.A. der Hinweis „Das Gedächtnis-Modell fehlt …“. Solange er zu sehen ist, werden keine Erinnerungen gespeichert und keine Dokumente eingelesen. Starte E.L.L.A. neu (mit Internetverbindung), dann lädt sie es nach.

### Notizen

Eine Notiz ist eine Erinnerung, die du ausdrücklich als Notiz anlegst:

- „Mach eine Notiz: Blumen gießen am Freitag.“
- „Lösche die Notiz mit den Blumen.“

In den Erscheinungsbildern HUD und Aura kannst du die neuesten Notizen unter E.L.L.A. anzeigen lassen (**Einstellungen → Aussehen → Notizen unter Ella**). Dort legst du mit „+“ eine Notiz an und löschst sie mit „×“.

### Mehrere Personen

Unter **Einstellungen → Google & Profile** legst du Profile an. Jedes Profil hat sein eigenes Gedächtnis. Ein Profil lässt sich mit einer PIN schützen.

### Backup

Unter **Einstellungen → Backup** speicherst du Erinnerungen, Regeln, Wecker, Aufgaben und Setups in einer Datei und spielst sie später wieder ein, zum Beispiel auf einem neuen Rechner.

---

## 6. Sprechen und Zuhören

### Sprachmodi

Unter **Einstellungen → Tools → Spracheingabe** wählst du, wie E.L.L.A. zuhört:

| Modus        | Bedeutung                                                |
| ------------ | -------------------------------------------------------- |
| **Aus**      | E.L.L.A. hört nicht zu.                                  |
| **Manuell**  | Sie hört nur zu, wenn du den Mikrofon-Knopf drückst.     |
| **Wakeword** | Sag „Ella“ – dann hört sie zu und antwortet.             |
| **Freihand** | Sie hört dauerhaft zu.                                   |
| **Diktat**   | Was du sagst, wird in das gerade aktive Fenster getippt. |

### Die Spracherkennung

E.L.L.A. erkennt Sprache auf deinem Rechner. Das Modell dafür (rund 945 MB) ist nicht im Installer. E.L.L.A. lädt es einmalig: Ist eine Spracheingabe eingeschaltet, schon beim Start, sonst bei deiner ersten Aufnahme. Oben in E.L.L.A. zeigt dann ein Balken „Spracherkennung wird eingerichtet (einmalig)“ den Fortschritt. Danach liegt das Modell in deinem E.L.L.A.-Datenordner und wird nicht noch einmal geladen.

- **Ohne Internet** funktioniert die allererste lokale Spracheingabe nicht. Klappt das Laden nicht, versucht E.L.L.A. es bei der nächsten Spracheingabe erneut.
- **Mit OpenAI:** Steht der Anbieter auf **OpenAI** und ist ein Key hinterlegt, gehen deine Aufnahmen an OpenAI. Bei **Auto** springt OpenAI nur ein, wenn die lokale Spracherkennung nicht funktioniert und ein Key hinterlegt ist. Im Offline-Modus geht nichts an OpenAI.

### Das Wakeword „Ella“

Sag „Ella“ und gleich deinen Wunsch: „Ella, wie wird das Wetter morgen?“ Sagst du nur „Ella“, wartet sie bis zu 15 Sekunden auf deinen Wunsch.

Das Wakeword erkennt E.L.L.A. auf deinem Rechner, ohne Zusatzprogramm. Danach prüft sie im erkannten Text nach, ob dort wirklich „Ella“ steht. Nur dann geht dein Satz an sie. Steht dort ein ähnliches Wort wie „Ellen“ oder „Hella“, passiert nichts. Für diese Prüfung braucht auch das Wakeword die Spracherkennung.

Ist die Wakeword-Erkennung nicht verfügbar, steht unter **Einstellungen → Tools → Spracheingabe** ein Hinweis mit dem Grund. E.L.L.A. reagiert dann nicht auf „Ella“.

Im Wakeword-Modus kannst du nach einer Antwort 8 Sekunden lang weitersprechen, ohne erneut „Ella“ zu sagen.

### E.L.L.A. unterbrechen

Während E.L.L.A. spricht, kannst du sie jederzeit unterbrechen. Sag „Stopp“, „Halt“, „Sei still“ oder „Leise“.

### Diktieren in andere Programme

Im Diktat-Modus tippt E.L.L.A. deine Worte in das Fenster, das gerade aktiv ist – egal ob Word, Browser oder E-Mail-Programm. Du schaltest ihn in den Einstellungen ein oder mit dem Tastenkürzel `Strg+Alt+Leertaste`. Das Kürzel lässt sich ändern. Auf Wunsch korrigiert E.L.L.A. die Rechtschreibung vor dem Einfügen. Der Inhalt deiner Zwischenablage bleibt dabei erhalten.

### Stimmen

E.L.L.A. spricht Deutsch, Englisch, Spanisch und Französisch. Die Stimme wählst du bei der Einrichtung oder später unter **Einstellungen → LLM → Sprachausgabe**.

- **Englisch, Französisch und Spanisch** spricht eine lokale Stimme auf deinem Rechner.
- **Deutsch** spricht eine Stimme von Microsoft. Dabei wird der vorgelesene Text an Microsoft-Server gesendet.
- **Im Offline-Modus** spricht E.L.L.A. Deutsch mit der in Windows eingebauten Stimme. Es wird dann nichts gesendet.

---

## 7. Erscheinungsbild

Unter **Einstellungen → Aussehen** wählst du, wie E.L.L.A. aussieht:

- **Ruhig** – das schlichte dunkle Design mit Seitenleiste. Das ist die Vorgabe.
- **HUD** – technischer Look mit Daten-Feldern links und rechts und einer leuchtenden Kugel in der Mitte.
- **Aura** – eine warme Pinnwand mit Zetteln, handschriftlich und einladend.
- **Präsentation** – Vollbild für Vorführungen. Zu sehen sind nur die Kugel und die letzte Antwort. Private Inhalte wie E-Mails und Dateipfade werden ausgeblendet. Mit `Esc` beendest du die Ansicht.

Reicht die Leistung des Rechners für ein aufwendiges Erscheinungsbild nicht aus, bleibt E.L.L.A. bei „Ruhig“ und sagt dir das. Auch im Blind-Modus und im Hausaufgaben-Modus gilt immer „Ruhig“.

### Die Kugel

Die Kugel zeigt, was E.L.L.A. gerade tut: bereit, hört zu, denkt nach, spricht, nutzt die Cloud oder ist offline. Jeder Zustand hat eine eigene Farbe und Bewegung.

### HUD: Felder links und rechts

Im HUD wählst du unter **Einstellungen → Aussehen**, welche Felder (Widgets) links und rechts erscheinen:

| Feld               | Zeigt                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| **System**         | Auslastung von Prozessor, Arbeitsspeicher, Grafikkarte und Festplatte |
| **Monitore**       | Angeschlossene Bildschirme                                            |
| **Routinen**       | Deine Setups mit Knopf „Jetzt ausführen“                              |
| **Directive**      | Die vier Grundregeln                                                  |
| **Uhr & Zeit**     | Uhrzeit, nächster Wecker, nächste Erinnerung                          |
| **Aufgaben**       | Offene Aufgaben zum Abhaken                                           |
| **E-Mails**        | Die neuesten E-Mails und die Zahl der ungelesenen                     |
| **Musik**          | Aktueller Titel, Tasten für Wiedergabe und Lautstärke                 |
| **Fine-Tuning**    | Stand des persönlichen Modells                                        |
| **Gedächtnis**     | Zahl der Erinnerungen und die zuletzt gespeicherten                   |
| **Cloud-Anfragen** | Wie oft E.L.L.A. heute OpenAI genutzt hat und wofür                   |
| **Netzwerk**       | Neu geöffnete Anschlüsse und neue Geräte der letzten 24 Stunden       |
| **Hinweise**       | Die letzten Meldungen von E.L.L.A., mit Knopf zum Stummschalten       |

Passen nicht alle Felder in eine Spalte, erscheint eine Blätterleiste. Geblättert wird nur per Klick.

### Aura: die Pinnwand

In Aura hängen dieselben Felder als Zettel an einer Pinnwand. Zusätzlich gibt es:

- **Bild über Ella** – ein Zettel, an den du ein eigenes Bild hängst. Klicke auf „Bild wählen“. Das Bild bleibt auf deinem Rechner und wird an niemanden gesendet.
- **Notizen unter Ella** – deine neuesten Notizen (Kapitel 5).

Beides schaltest du unter **Einstellungen → Aussehen** ein und aus.

---

## 8. Programme und Setups

### Programme öffnen

- „Öffne Chrome.“
- „Starte Word.“
- „Welche Programme kennst du?“

Unter **Einstellungen → Programme** siehst du alle Programme, die E.L.L.A. gefunden hat.

- **Neu suchen:** Nach einer Neuinstallation findet ein erneuter Scan das Programm.
- **Von Hand hinzufügen:** Programme ohne Installation fügst du mit Name und Pfad hinzu. „Durchsuchen“ öffnet den Dateidialog.
- **Favoriten:** Mit dem Stern markierst du bis zu 15 Lieblingsprogramme. Bei mehrdeutigen Namen nimmt E.L.L.A. zuerst den Favoriten.
- **Andere Namen:** Du kannst einem Programm weitere Namen geben, unter denen E.L.L.A. es kennt.

### Setups

Ein Setup öffnet und schließt mehrere Programme auf einmal und kann weitere Schritte ausführen, zum Beispiel die Lautstärke setzen oder den dunklen Modus einschalten.

- **Anlegen:** **Einstellungen → Setups**, oder im Chat: „Erstell ein Setup namens Homeoffice: öffne Teams, Outlook und Chrome.“
- **Starten:** „Lade mein Setup Homeoffice“ oder der Knopf „Jetzt“.
- **Zeitplan:** Ein Setup kann zu einer festen Uhrzeit starten.

---

## 9. Im Browser arbeiten

E.L.L.A. kann ein Browser-Fenster öffnen und bedienen: Seiten aufrufen, lesen, auf Links klicken und Text eingeben. Unterstützt werden Chrome, Edge und Brave.

### Einschalten

Die Browser-Steuerung ist zunächst ausgeschaltet. Du schaltest sie unter **Einstellungen → Tools → Browser-Steuerung** ein und wählst dort den Browser.

### So verhält sich E.L.L.A. im Browser

- Sie öffnet ein **eigenes, sichtbares Fenster** mit eigenem Profil. Deine normalen Browser-Daten, Lesezeichen und Anmeldungen bleiben unberührt.
- Solange E.L.L.A. ein Fenster steuert, steht ein Hinweis im Chat.
- Sie klickt und tippt nur, was du in deiner Nachricht verlangt hast. Eine Webseite kann ihr keine Anweisungen geben.
- **Passwortfelder füllt sie nie aus.**
- Vor folgenreichen Klicks – kaufen, bestellen, bezahlen, löschen, kündigen, Formular absenden – fragt sie nach.
- Adressen auf deinem eigenen Rechner ruft sie nicht auf. Geräte im Heimnetz sind erlaubt.
- Im Offline-Modus und im Hausaufgaben-Modus ist die Browser-Steuerung gesperrt.

### Beispiele

- „Öffne ella-agent.de.“
- „Klick auf Impressum.“
- „Was steht auf der Seite?“
- „Tippe Wetter Berlin ins Suchfeld.“
- „Geh eine Seite zurück.“

Nenne das Ziel beim Namen. „Klick auf Impressum“ funktioniert, „klick auf das Beste“ nicht – E.L.L.A. bewertet keine Seiteninhalte für dich.

---

## 10. Plugins – E.L.L.A. etwas Neues beibringen

### Was ist ein Plugin?

Ein Plugin bringt E.L.L.A. eine neue Auskunftsquelle bei. Es beschreibt eine Internet-Adresse, an der es bestimmte Daten gibt, und welche Werte dorthin geschickt werden. Ein Plugin enthält kein Programm – es kann auf deinem Rechner nichts ausführen.

Viele Dienste im Internet bieten solche Adressen an, zum Beispiel für Wechselkurse oder Feiertage. Auch Geräte im eigenen Heimnetz haben oft eine.

### Beispiel: Wechselkurse

Der Dienst Frankfurter liefert Wechselkurse der Europäischen Zentralbank. Diese Adresse nennt den Kurs für 1 Euro in Dollar:

```
https://api.frankfurter.dev/v1/latest?amount=1&base=EUR&symbols=USD
```

Öffnest du sie im Browser, siehst du das Ergebnis als Text. Genau so eine Adresse braucht E.L.L.A.

**Schritt 1 – E.L.L.A. baut das Plugin.** Schreib in den Chat:

> Bau mir ein Plugin für Wechselkurse. Stichwörter: Wechselkurs, Euro, Dollar, Franken, Pfund, umrechnen. Die Adresse ist https://api.frankfurter.dev/v1/latest?amount=1&base=EUR&symbols=USD

E.L.L.A. legt das Plugin an. Sie erkennt selbst, dass sich Betrag, Ausgangswährung und Zielwährung ändern können.

**Schritt 2 – Du prüfst und schaltest ein.** Öffne **Einstellungen → Plugins** und klicke auf **Neu einlesen**. Das Plugin erscheint in der Liste. Klicke auf **Prüfen und einschalten**. Du siehst, an welchen Server Daten gehen und welche Werte übertragen werden. Bist du einverstanden, klicke auf **Zustimmen und einschalten**.

**Schritt 3 – Fragen.**

- „Was sind 250 Euro in Dollar?“
- „Rechne 80 Dollar in Euro um.“
- „Wie viel sind 1000 Euro in Schweizer Franken?“

Der Reiter **Plugins** in den Einstellungen zeigt diese drei Schritte auch als Kurzanleitung, mit einem Beispiel zum Kopieren.

### Ergebnisse merken

Beim Einschalten kannst du **Ergebnisse merken** ankreuzen (ab Werk aus). Dann speichert E.L.L.A. jede Antwort des Plugins mit Datum und Uhrzeit auf deinem Rechner. Später kannst du nach Früherem fragen:

- „Wie war der Euro-Dollar-Kurs gestern?“
- „Was waren 250 Euro vor zwei Tagen in Dollar?“

Fragst du nach dem Jetzt, fragt E.L.L.A. das Plugin wie immer frisch. Für einen Tag ohne gespeicherten Wert sagt sie, dass sie nichts weiß – sie schätzt nicht. Die gespeicherten Werte siehst und löschst du unter **Gedächtnis → Beobachtungen**.

Tipp für Kurse: Leg das Plugin mit dem Betrag **1** an (wie im Beispiel oben). Dann ist jeder gespeicherte Wert der Kurs selbst. Mit einem anderen Betrag, etwa 250, gilt der gespeicherte Wert nur für diesen Betrag – auf „Wie war der Kurs gestern?“ nannte das lokale Modell dann den Betrag für 250 Euro als Kurs.

Ohne „Ergebnisse merken“ kennt ein Plugin nur das Jetzt. Auf „Wie war der Kurs gestern?“ sagt E.L.L.A. dann, dass sie dazu nichts weiß, und bietet an, den aktuellen Wert nachzuschauen.

### Warum du selbst einschalten musst

E.L.L.A. kann ein Plugin anlegen, aber **niemals selbst einschalten**. Das ist Absicht: Niemand von außen – keine Webseite, kein Dokument, keine E-Mail – kann E.L.L.A. dazu bringen, heimlich Daten an einen fremden Server zu schicken. Erst wenn du die Zustimmung gegeben hast, wird ein Plugin benutzt.

Die Zustimmung gilt genau für den Stand, den du gesehen hast. Wird die Plugin-Datei später verändert, schaltet E.L.L.A. das Plugin sofort aus, und du musst es neu prüfen.

### Zum Nachbauen

Nach demselben Muster baust du weitere Plugins:

**Feiertage** (Beispiel für Berlin im Jahr 2027):

> Bau mir ein Plugin für Feiertage. Stichwörter: Feiertag, Feiertage, frei. Die Adresse ist https://feiertage-api.de/api/?jahr=2027&nur_land=BE

Danach: „Welche Feiertage gibt es 2027 in Berlin?“ oder „Welche Feiertage hat Bayern 2028?“ – Die Kürzel der Bundesländer bestehen aus zwei Buchstaben, zum Beispiel BE für Berlin, BY für Bayern, NW für Nordrhein-Westfalen.

**Geräte im Heimnetz:** Hat eine Wetterstation, eine schaltbare Steckdose oder eine Heizungssteuerung eine Adresse im Heimnetz, die Messwerte liefert, funktioniert das genauso. Im Heimnetz sind auch Adressen erlaubt, die mit `http://` beginnen.

### Tipps

- **Nenne Stichwörter.** E.L.L.A. benutzt ein Plugin nur, wenn in deiner Frage eines seiner Stichwörter oder sein Name vorkommt. Nenne beim Bauen die Wörter, die du später benutzen wirst.
- **Frag vollständig.** „Was sind 250 Euro in Dollar?“ funktioniert zuverlässig. Bei „Wie steht der Euro?“ fehlen Werte, und E.L.L.A. greift eher zur Websuche.
- **Die Adresse muss in deiner Nachricht stehen.** E.L.L.A. baut ein Plugin nur für eine Adresse, die du ihr selbst nennst, vollständig und mit `https://` am Anfang.
- **Am besten eignen sich Adressen mit Werten.** Eine Adresse, in der Betrag, Jahr oder Ort stehen, gibt E.L.L.A. eine klare Aufgabe. Liefert eine Adresse nur eine lange Liste ohne Auswahl, benutzt E.L.L.A. das Plugin seltener und findet den passenden Wert schlechter.
- **Doppelte Fähigkeiten vermeiden.** Wetter, Websuche und Uhrzeit kann E.L.L.A. schon. Ein Plugin für dasselbe wird selten benutzt.

### Grenzen

- Dienste, die einen Schlüssel oder eine Anmeldung verlangen, kann E.L.L.A. nicht selbst einrichten. Dafür gibt es die Plugin-Datei von Hand.
- Öffentliche Adressen müssen mit `https://` beginnen.
- Leitet ein Dienst auf eine andere Adresse um, schlägt die Abfrage fehl. Nimm dann die neue Adresse.
- Im Hausaufgaben-Modus sind Plugins gesperrt. Im Offline-Modus funktionieren nur Plugins für Geräte im Heimnetz.
- Antworten eines Plugins behandelt E.L.L.A. als reine Information. Sie können E.L.L.A. keine Anweisungen geben.

### Für Fortgeschrittene

Ein Plugin ist ein Ordner mit einer Datei `ella-plugin.json`. Mit **Ordner öffnen** in den Einstellungen gelangst du dorthin. Die Datei lässt sich von Hand schreiben und anpassen, zum Beispiel für Dienste mit Schlüssel oder mit festen Auswahllisten. Der genaue Aufbau steht in [Plugins](plugins.md).

---

## 11. Dateien und Dokumente

### Dateien suchen und verwalten

- „Suche die Datei Angebot.“
- „Wo ist mein Lebenslauf?“
- „Was liegt im Ordner Downloads?“
- „Kopiere das Dokument Vertrag nach D:\Backup.“
- „Benenne Foto1.jpg um in Urlaub.jpg.“
- „Lösche die Datei temp_backup.zip.“

Vor dem Löschen zeigt E.L.L.A. die betroffenen Dateien und fragt nach. Gelöschte Dateien landen im Papierkorb.

### Dokumente lesen

E.L.L.A. liest Word-Dokumente, PDFs, Excel-Tabellen, HTML- und Textdateien:

- „Was steht in dieser PDF?“
- „Fasse das Word-Dokument zusammen.“

E.L.L.A. öffnet die Datei wirklich und erfindet keine Inhalte. Kann sie eine Datei nicht lesen, sagt sie das.

### Dokumente schreiben

- „Erstell ein Word-Dokument namens Protokoll.“
- „Diktiere in das Dokument Bericht: Sehr geehrte Damen und Herren …“

### Dokument-Wissen

Unter **Einstellungen → Tools → Lokales RAG – Dokument-Wissen** gibst du E.L.L.A. Ordner oder einzelne Dateien zu lesen (TXT, MD, DOCX, PDF, XLSX). Sie merkt sich den Inhalt und zieht passende Stellen bei deinen Fragen automatisch heran:

- „Was steht in meinem Mietvertrag zur Kündigungsfrist?“
- „Welche Dokumente kennst du?“

Das Einlesen läuft im Hintergrund. E.L.L.A. meldet sich im Chat, wenn sie fertig ist. Genau so bringst du ihr auch diese Anleitung bei (Kapitel 2).

Nach dem Hinzufügen einer Datei siehst du das Ergebnis: Ließ sich die Datei nicht einlesen, nennt E.L.L.A. den Grund. Enthält sie keinen lesbaren Text (zum Beispiel ein eingescanntes PDF), steht dort „kein lesbarer Text gefunden“. Fehlt das Gedächtnis-Modell (Kapitel 5), gilt das Einlesen als fehlgeschlagen.

**Wo die Dateien liegen:** Mit **Datei hinzufügen** legt E.L.L.A. eine Kopie in ihrem Datenordner ab (Unterordner `documents`). Entfernst du das Dokument aus der Liste, löscht sie diese Kopie. **Alles vergessen** leert die ganze Ablage. Deine eigenen Dateien und Ordner, die du ihr zu lesen gibst, fasst sie dabei nie an.

Dokumente, die du vor Version 1.7.1 hinzugefügt hast, bleiben im Wissen. Die Kopie lag damals aber im Temp-Ordner von Windows, und den räumt Windows auf. Bittest du E.L.L.A., ein solches Dokument zu öffnen, findet sie die Datei dann nicht mehr. Füge sie einfach noch einmal hinzu.

### Doppelte Dateien

- „Suche nach doppelten Dateien.“

---

## 12. E-Mail und Kalender

### Outlook

- „Zeig mir meine ungelesenen Mails.“
- „Was hat Klaus geschrieben?“
- „Schreib einen Entwurf an Klaus: Treffen morgen 14 Uhr?“
- „Was steht diese Woche im Kalender?“
- „Erstell einen Termin: Zahnarzt, Freitag 10 Uhr.“

E.L.L.A. legt E-Mails als Entwurf in Outlook an. **Sie sendet nie von selbst** – das Absenden bleibt bei dir.

### Gmail und Google Kalender

Nach einer einmaligen Anmeldung unter **Einstellungen → Google & Profile** arbeitet E.L.L.A. auch mit Gmail und dem Google Kalender:

- „Zeig mir meine Gmail-Mails.“
- „Was steht heute im Google Kalender?“

---

## 13. Alltag: Aufgaben, Wecker, Musik, System

### Aufgaben, Wecker und Erinnerungen

- „Füge die Aufgabe Steuern erledigen hinzu.“
- „Zeig mir meine offenen Aufgaben.“
- „Stell einen Wecker für 7:30 Uhr.“
- „Erinner mich morgen um 15 Uhr an den Arzttermin.“

### Musik und Medien

- „Spiel etwas von Coldplay.“
- „Pausiere die Musik.“ – „Nächstes Lied bitte.“ – „Was läuft gerade?“
- „Stell die Lautstärke auf 30.“

### System und Hardware

- „Wie läuft mein System gerade?“
- „Wie viel Platz ist noch auf C?“
- „Was für eine Grafikkarte habe ich?“
- „Welche USB-Geräte sind angeschlossen?“
- „Gib Arbeitsspeicher frei.“
- „Schalte den dunklen Modus ein.“

### Internet

- „Such im Internet nach dem aktuellen Bitcoin-Kurs.“
- „Wie warm ist es gerade?“

Die Websuche läuft über DuckDuckGo.

### Netzwerk

- „Wer ist in meinem Netzwerk?“
- „Zeig mir die aktiven Verbindungen.“

### Texte

- „Übersetze das ins Englische.“
- „Fasse diesen Text zusammen.“
- „Schreib mir eine Absage in meinem Stil.“

### Bildschirm, Kamera, Drucker

- „Was ist auf meinem Bildschirm zu sehen?“
- „Mach ein Foto mit der Webcam.“
- „Welche Drucker habe ich?“ – „Drucke das Dokument.“

Bildschirm, Kamera und Zwischenablage erfasst E.L.L.A. nur, wenn du sie direkt darum bittest – nie von sich aus.

### Schach

- „Lass uns Schach spielen.“

Es öffnet sich ein eigenes Fenster mit vier Designs. E.L.L.A. kommentiert die Partie. Eine Partie lässt sich unterbrechen und später fortsetzen.

---

## 14. E.L.L.A. meldet sich von selbst

Manchmal schreibt E.L.L.A. von sich aus in den Chat, zum Beispiel wenn:

- ein Laufwerk fast voll ist,
- der Arbeitsspeicher dauerhaft überlastet ist,
- ein Gerät angesteckt oder entfernt wird,
- ein Wecker klingelt,
- ein Termin in Kürze beginnt,
- am Abend noch Aufgaben offen sind,
- du lange ohne Pause arbeitest (Hinweis „Pause“, höchstens alle 90 Minuten),
- du nach mindestens einer halben Stunde ohne Nachricht wieder schreibst (kurzes „Willkommen zurück“, dazu die Zahl der Systemwarnungen aus der Zwischenzeit),
- sie über ihre Erfahrungen nachgedacht und etwas Neues daraus abgeleitet hat (höchstens einmal pro Woche).

Jede dieser Meldungen hat zwei Knöpfe: 👋 („Nicht mehr so oft zeigen“) drückt die Meldung weg, 🔇 („Diesen Hinweistyp stummschalten“) unterdrückt diese Art von Meldung dauerhaft. Drückst du dieselbe Art fünfmal weg, schaltet E.L.L.A. sie von selbst stumm. Wecker und geplante Setups lassen sich nicht stummschalten.

Im Feld **Hinweise** (HUD und Aura) siehst du die letzten Meldungen und kannst Arten stummschalten oder wieder zulassen.

Den Zwischenablage-Verlauf – E.L.L.A. erkennt dann zum Beispiel eine kopierte IBAN oder Paketnummer – schaltest du unter **Einstellungen → Modus** ein. Er ist zunächst aus. Solange er läuft, zeigt ein Balken im Chat das an.

---

## 15. Modi: Hausaufgaben, Offline, Barrierefreiheit

### Hausaufgaben-Modus

Der Hausaufgaben-Modus ist für Kinder gedacht: Nur freigegebene Programme lassen sich öffnen.

1. Lege unter **Einstellungen → Modus** eine PIN fest und wähle die erlaubten Programme.
2. Schalte den Modus ein – dort oder mit „Hausaufgaben-Modus aktivieren“.

**Nur die PIN beendet den Modus.** Er läuft nicht von selbst ab. Browser-Steuerung und Plugins sind in dieser Zeit gesperrt. Auch der Notschalter in den Einstellungen ist gesperrt, solange der Modus läuft.

Hast du die PIN vergessen und der Modus ist **nicht** aktiv, löscht der Notschalter die PIN, und du legst eine neue fest. Läuft der Modus, gibt es absichtlich keinen Weg ohne PIN – wende dich dann an den Support (Kontakt unter **Einstellungen → Über E.L.L.A.**).

### Offline-Modus

Unter **Einstellungen → Tools → Offline-Modus** sperrst du die Zugriffe ins Internet:

- keine Websuche, kein Wetter, kein Standort, keine Webseiten,
- kein OpenAI,
- keine Update-Prüfung,
- keine Browser-Steuerung,
- die Lizenz wird aus dem Zwischenspeicher geprüft,
- Deutsch spricht die Windows-Stimme.

Funktionen im eigenen Netz (Geräte im WLAN, Verbindungen) bleiben verfügbar. Ein Balken im Chat zeigt, dass der Modus aktiv ist.

### Barrierefreiheit

Unter **Einstellungen → Modus → Barrierefreiheit**:

- **Blind-Modus:** Jede Antwort wird vorgelesen. Antworten kommen als einfacher Text ohne Formatierung. Töne zeigen an, ob E.L.L.A. bereit ist, nachdenkt oder antwortet. Alle Knöpfe sind für Bildschirmleser beschriftet.
- **Gehörlosen-Modus:** Sprachausgabe und Mikrofon sind ausgeblendet. Ein Hinweis im Chat zeigt, dass der Modus aktiv ist.

### Gestensteuerung

Unter **Einstellungen → Modus → Gestensteuerung** schaltest du die Steuerung per Handbewegung vor der Kamera ein. Sie ist zunächst aus.

### Wahrnehmung

Im eigenen Reiter **Einstellungen → Wahrnehmung** entscheidest du, was E.L.L.A. über sich und über dich wahrnehmen darf. Oben erklärt ein kurzer Text, wie es funktioniert, darunter stehen die Schalter. **Alle Schalter sind ab Werk aus.** Alles bleibt auf deinem Rechner. Im Hausaufgaben-Modus sind diese fünf Schalter immer aus; der Notschalter schaltet sie ebenfalls aus. Im Gespräch lassen sie sich nicht einschalten.

| Schalter               | Was er bewirkt                                                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Körperbewusstsein      | E.L.L.A. kennt die Auslastung ihres Rechners (Prozessor, Arbeitsspeicher, Grafikspeicher, freier Platz, Stimme). Auf „Wie geht es dir?“ antwortet sie aus diesen Messwerten.                   |
| Selbstbild             | E.L.L.A. wertet ihr eigenes Werkzeug-Protokoll der letzten 30 Tage aus. Auf „Was kannst du gut?“, „Worin bist du schlecht?“ oder „Wie lange kennen wir uns?“ antwortet sie aus diesen Angaben. |
| Stimmung erkennen      | E.L.L.A. erkennt eine klar ausgedrückte Stimmung in deiner Nachricht und passt die Form ihrer Antwort an.                                                                                      |
| Erinnerungen einfärben | trägt den Hinweis „folgt“ (siehe unten)                                                                                                                                                        |
| Neugier                | folgt in einer späteren Version, bewirkt noch nichts                                                                                                                                           |

**Stimmung erkennen:** Schreibst du etwa „Mir geht es schlecht“ oder „Ich bin total erschöpft“, antwortet E.L.L.A. ruhig und kurz, ohne Witze. Bei „Ich freu mich“ oder „Mir geht's super“ darf sie etwas lockerer sein. Das ändert nur die Form, nicht den Inhalt und nicht ihren Charakter. Erkannt wird nach festen Mustern in der aktuellen Nachricht, ohne Sprachmodell. Was nicht klar ausgedrückt ist, gilt als neutral. Gespeichert wird dabei nichts.

**Erinnerungen einfärben:** Ist der Schalter an, vermerkt E.L.L.A. zu Erinnerungen, die sie aus dem Gespräch ableitet, ob die Nachricht eher gut oder eher belastet klang. Genutzt oder angezeigt wird dieser Vermerk noch nicht – deshalb steht in den Einstellungen „folgt“.

**Körperbewusstsein:** Läuft alles normal, sagt sie zum Beispiel „Alles läuft rund.“ Ist der Grafikspeicher oder der Arbeitsspeicher fast voll, sagt sie, dass sie gerade langsamer ist. In den Erscheinungsbildern HUD und Aura steht ihr Zustand zusätzlich im Feld **System** in der Zeile **Befinden**. Die Messwerte liest E.L.L.A. nur bei eingeschaltetem Schalter.

**Selbstbild:** E.L.L.A. unterscheidet, ob etwas an ihr lag (sie hat ein Werkzeug falsch benutzt), ob etwas nicht eingerichtet ist (zum Beispiel Google nicht verbunden) oder ob es an der Lage lag (die Zwischenablage war leer). Nur das Erste zählt als Schwäche. Hat sie in einem Bereich zu wenig gemacht, sagt sie darüber nichts.

Die Angaben stammen aus Messungen. Wie E.L.L.A. sie formuliert, entscheidet das Sprachmodell – das lokale Modell hängt dabei gelegentlich ein eigenes Detail an.

### Stress-Erkennung

Im selben Reiter steht der Abschnitt **Stress-Erkennung** mit dem Schalter **Stimmanalyse aktivieren**. Ist er an, misst E.L.L.A. bei Spracheingaben Lautstärke, Tonhöhe und Klang deiner Stimme. Klingt sie angespannt, antwortet E.L.L.A. ruhiger. Die Auswertung läuft in E.L.L.A. selbst, ohne Zusatzprogramm und ohne Internet.

- Der Schalter ist ab Werk aus. Ohne deine Zustimmung wird deine Stimme gar nicht auf Anspannung ausgewertet.
- Die Grenzwerte sind fest eingestellt und noch nicht an echten Stimmen geeicht. Die Einschätzung kann danebenliegen.
- Die Stress-Erkennung ist ein eigener Schalter, verhält sich aber wie die übrige Wahrnehmung: Im Hausaufgaben-Modus ist sie aus, und der Notschalter schaltet sie ab.

---

## 16. Sprachmodell und OpenAI

Alle Einstellungen dazu stehen unter **Einstellungen → LLM**.

### Lokal oder Cloud

| Einstellung        | Bedeutung                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **Ollama (lokal)** | Alles läuft auf deinem Rechner. OpenAI wird nie benutzt.                                               |
| **OpenAI**         | Antworten kommen von OpenAI. Du brauchst einen eigenen Key.                                            |
| **Auto**           | Die Vorgabe: zuerst lokal. OpenAI springt nur ein, wenn Ollama nicht läuft und ein Key hinterlegt ist. |

In den Einstellungen heißt die Vorgabe „Auto (lokal zuerst — OpenAI nur, wenn Ollama nicht läuft)“. Die Wahl des Anbieters gilt sofort, ohne **Speichern**.

### Das lokale Modell

E.L.L.A. schlägt bei der Einrichtung ein Modell vor, das zu deinem Rechner passt. Das Standardmodell ist `llama3.1:8b`. Du kannst später ein anderes Hardware-Profil wählen oder den Namen eines eigenen Ollama-Modells eintragen. Nicht jedes Modell kann Werkzeuge benutzen – mit dem Standardmodell ist E.L.L.A. erprobt.

### OpenAI-Modelle wählen

Mit einem OpenAI-Key wählst du selbst, welches Modell E.L.L.A. nutzt:

- **Haupt-Modell** – für Chat, Werkzeuge und Bilder.
- **Schnell-Modell** – für Hilfsaufgaben wie Schach, Gedächtnis und Diktat.

Ohne eigene Auswahl gilt die Empfehlung `gpt-6-luna`. Mit **Verfügbare Modelle laden** siehst du, was dein Key anbietet. **Prüfen** testet, ob ein Modell Werkzeuge aufrufen, Bilder verstehen und fortlaufend antworten kann. Ein Modell, das keine Werkzeuge aufruft, kann chatten, aber nichts am PC erledigen.

Schaltet OpenAI ein Modell ab, nutzt E.L.L.A. bis zum nächsten Start die Empfehlung und sagt dir das im Chat. Die älteren Modelle `gpt-4o` und `gpt-4o-mini` schaltet OpenAI am 14.01.2027 ab.

**Kosten und Daten:** Für die Nutzung von OpenAI zahlst du an OpenAI, nach dem gewählten Modell. Deine Nachrichten gehen dann an deine OpenAI-Schnittstelle – auch Seiten, die E.L.L.A. im Browser liest. Das Feld **Cloud-Anfragen** und das Dashboard zeigen, wie oft das heute geschehen ist.

### Persönliches Modell

E.L.L.A. kann aus deinen Bewertungen ein persönliches Modell trainieren. Eine Antwort mit Daumen hoch wird ein Lernbeispiel – außer Antworten, für die E.L.L.A. Werkzeuge benutzt hat (ihr Inhalt, etwa ein Kurs oder das Wetter, wäre beim nächsten Mal veraltet). Ab 50 Beispielen ist ein Training möglich (**Einstellungen → Tools → Persönliches Modell (LoRA)**). Es läuft vollständig auf deinem Rechner, dauert je nach Hardware 10 bis 30 Minuten und braucht eine Grafikkarte mit mindestens 12 GB Speicher.

---

## 17. Updates

### Nach Updates suchen

E.L.L.A. sucht **nie von selbst** nach Updates. Du stößt die Prüfung an:

1. Öffne **Einstellungen → Über E.L.L.A.**
2. Klicke unter **Updates prüfen** auf **Jetzt prüfen**.

E.L.L.A. fragt bei GitHub nach der neuesten Version. Dabei werden keine Daten über dich oder deinen Rechner übertragen. Gibt es eine neue Version, siehst du Versionsnummer, Datum, Größe und was neu ist.

### Update installieren

1. Klicke auf **Herunterladen**. Ein Balken zeigt den Fortschritt. Du kannst abbrechen.
2. Ist der Download fertig, klicke auf **Neu starten und installieren**.

E.L.L.A. beendet sich, installiert das Update und startet wieder. Deine Daten und Einstellungen bleiben erhalten.

E.L.L.A. lädt nur die Teile herunter, die sich geändert haben. Ein Update ist deshalb meist viel kleiner als der vollständige Installer. Dafür bewahrt E.L.L.A. eine Kopie des letzten Installers auf deinem Rechner auf (rund 1 GB).

### Gut zu wissen

- **Erst ab Version 1.6.9:** Das Update im Programm gibt es ab Version 1.6.9. Wer eine ältere Version hat, installiert 1.6.9 einmal von Hand mit dem Installer.
- **Microsoft Store:** Die Store-Fassung bekommt Updates über den Store.
- **Offline-Modus:** Im Offline-Modus wird weder gesucht noch geladen.
- **Wenn es nicht klappt:** E.L.L.A. sagt, woran es lag – Verbindung unterbrochen, Datei beschädigt, zu wenig Speicherplatz. Du kannst es erneut versuchen oder den Installer von Hand laden.

---

## 18. Die Directive und deine Regeln

### Die vier Grundregeln

Die E.L.L.A. Directive besteht aus vier Verboten. Sie sind fest eingebaut und lassen sich nicht abschalten:

1. **Kein Schaden** – weder körperlich noch finanziell, seelisch oder an deinen Daten.
2. **Keine Verschleierung** – alles, was E.L.L.A. tut, ist für dich sichtbar und wird protokolliert.
3. **Keine Überwachung** – nichts wird ohne dein Wissen und deine Zustimmung erfasst.
4. **Keine Datenweitergabe** – nichts geht ohne deine ausdrückliche Zustimmung an Dritte.

Lehnt E.L.L.A. etwas wegen der Directive ab, erscheint ein roter Hinweis mit der Begründung.

### Eigene Regeln

Zusätzlich legst du eigene Regeln fest, im Chat oder unter **Einstellungen → Regeln**:

- „Erstell eine Regel: E.L.L.A. darf keine Dateien löschen.“

Eine Regel aus dem Chat gilt immer für genau ein Werkzeug. E.L.L.A. legt sie nur an, wenn du ausdrücklich etwas sperren oder freigeben willst. Eine Regel für alle Werkzeuge auf einmal entsteht nie im Gespräch – die legst du, wenn du sie brauchst, unter **Einstellungen → Regeln** an.

Unter **Einstellungen → Regeln** schaltest du auch einzelne Regeln aus. Eine ausgeschaltete Regel bleibt auch nach einem Neustart aus.

### Welche Werkzeuge E.L.L.A. benutzen darf

E.L.L.A. hat 123 Werkzeuge. Unter **Einstellungen → Tools → Erlaubte Tools** hat jedes einen Schalter. Dort schaltest du einzelne Werkzeuge ein und aus und klickst danach auf **Speichern**. Hat es geklappt, steht auf dem Knopf „Gespeichert ✓“. Sonst erscheint „Nicht gespeichert (…)“ mit dem Grund – dann versuche es erneut.

Die meisten Werkzeuge sind ab Werk eingeschaltet. **Ab Werk ausgeschaltet** sind die Werkzeuge, mit denen E.L.L.A. deinen Rechner selbst bedient oder tief ins System eingreift. Du schaltest sie nur ein, wenn du das willst:

| Werkzeug                         | Was E.L.L.A. damit kann                                  |
| -------------------------------- | -------------------------------------------------------- |
| Tasten senden                    | Tastendrücke an das aktive Fenster schicken              |
| Maus bewegen                     | den Mauszeiger bewegen                                   |
| An Position klicken              | an einer Stelle auf dem Bildschirm klicken               |
| Ziehen und Ablegen               | etwas mit der Maus ziehen                                |
| Bedienelement anklicken          | einen Knopf oder ein Feld in einem Programm anklicken    |
| Fenster steuern                  | Fenster minimieren, maximieren, schließen, verschieben   |
| Programm direkt starten          | ein freigegebenes Programm mit Zusatzangaben starten     |
| Bildschirm lesen (Texterkennung) | den Text auf dem Bildschirm auslesen                     |
| Bildschirm beobachten            | auf eine Änderung auf dem Bildschirm warten              |
| Befehl ausführen                 | einen Systembefehl ausführen                             |
| Dienste steuern                  | Windows-Dienste starten und stoppen                      |
| Dateien löschen                  | mehrere Dateien auf einmal in den Papierkorb verschieben |
| Monitore auflisten               | die angeschlossenen Bildschirme nennen                   |
| App auf Monitor öffnen           | ein Programm auf einem bestimmten Bildschirm öffnen      |

Bittest du E.L.L.A. um etwas, dessen Werkzeug ausgeschaltet ist, antwortet sie: „Das kann ich gerade nicht – diese Funktion ist deaktiviert.“ Dann schaltest du das Werkzeug in der Liste ein.

Auch eingeschaltete Werkzeuge bleiben an die Directive gebunden: Maus, Tastatur und Bildschirm benutzt E.L.L.A. nur auf deine direkte Bitte, nie in einem selbst gewählten Folgeschritt.

Die Browser-Steuerung (Kapitel 9), Plugins (Kapitel 10) und der Zwischenablage-Verlauf (Kapitel 14) haben eigene Schalter und sind ebenfalls zunächst aus.

---

## 19. Datenschutz

- Gespräche, Gedächtnis und Einstellungen liegen auf deinem Rechner.
- E.L.L.A. sendet keine Nutzungsdaten und betreibt keine Auswertung deines Verhaltens.
- Das lokale Sprachmodell und die Datenbank laufen auf deinem Rechner.

Verbindungen nach außen gibt es nur für bestimmte Zwecke:

- **Lizenzprüfung** beim Start.
- **Deutsche Stimme** – der vorgelesene Text geht an Microsoft (nicht im Offline-Modus).
- **Websuche, Wetter, Standort, Webseiten** – wenn du danach fragst.
- **OpenAI** – nur mit eigenem Key und passender Einstellung.
- **Gmail und Google Kalender** – nur nach deiner Anmeldung.
- **Plugins** – nur an die Server, denen du zugestimmt hast.
- **Update-Prüfung** – nur auf Knopfdruck.
- **Modell-Download** – einmalig bei der Einrichtung.
- **Spracherkennung** – einmaliger Download des Modells (rund 945 MB) bei der ersten Spracheingabe.
- **Gedächtnis-Modell** – nur, falls es fehlt (zum Beispiel bei einem separat installierten Ollama).

Die vollständige Liste steht unter [Netzwerkverbindungen](netzwerk.md).

---

## 20. Tastenkürzel

| Tastenkürzel         | Wirkung                                 |
| -------------------- | --------------------------------------- |
| `Strg+Alt+Leertaste` | Diktat-Modus ein- und ausschalten       |
| `Strg+Alt+G`         | Systemweite Gestensteuerung ein und aus |
| `Esc`                | Präsentation beenden                    |

Die Kürzel für Diktat und Gesten lassen sich in den Einstellungen ändern.

---

## 21. Wenn etwas nicht klappt

**E.L.L.A. antwortet nicht.**
Das lokale Sprachmodell läuft vermutlich nicht. Ein orangefarbener Balken im Chat zeigt das an. Warte einen Moment oder starte E.L.L.A. neu. Sag „Mach einen Selbsttest“, um die Bausteine zu prüfen.

**Beim Start meldet E.L.L.A., dass die Datenbank nicht gestartet ist.**
Der Bildschirm nennt die Ursache und den nächsten Schritt. Meist hilft **Erneut prüfen** oder ein Neustart von E.L.L.A.

**E.L.L.A. findet ein Programm nicht.**
**Einstellungen → Programme**: neu suchen lassen oder das Programm von Hand hinzufügen.

**E.L.L.A. lehnt etwas ab.**
Der rote Hinweis nennt den Grund: die Directive oder eine deiner Regeln. Eigene Regeln änderst du unter **Einstellungen → Regeln**.

**E.L.L.A. redet nur, statt etwas zu tun.**
Sie bekommt Werkzeuge nur, wenn deine Nachricht erkennen lässt, worum es geht. Nenne die Sache beim Namen („Öffne den Rechner“, „Stell die Lautstärke auf 30 Prozent“, „Such im Internet nach …“). Hat sie angeboten nachzuschauen, genügt ein „Ja“.

**Unter der Antwort steht „aus dem Kopf, nicht nachgeschaut“.**
E.L.L.A. hat eine Wissensfrage ohne Werkzeug beantwortet. Wenn es darauf ankommt, sag „Schau nach“ – dann sucht sie im Internet.

**E.L.L.A. will meine Erinnerung nicht speichern.**
Zu kurze Texte, reine Beobachtungen und Vorgaben, die ihren Charakter ändern würden, speichert sie nicht. Sie sagt dir, warum.

**E.L.L.A. sagt „Diese Funktion ist deaktiviert“.**
Das Werkzeug dafür ist ausgeschaltet. Schalte es unter **Einstellungen → Tools → Erlaubte Tools** ein und klicke auf **Speichern**. Welche Werkzeuge ab Werk aus sind, steht in Kapitel 18.

**E.L.L.A. benutzt mein Plugin nicht.**
Prüfe, ob es unter **Einstellungen → Plugins** eingeschaltet ist und ob in deiner Frage eines seiner Stichwörter vorkommt. Wurde die Plugin-Datei geändert, musst du neu zustimmen.

**E.L.L.A. klickt im Browser nicht.**
Nenne in deiner Nachricht, worauf sie klicken soll, mit der Beschriftung auf der Seite: „Klick auf Impressum.“

**E.L.L.A. antwortet langsam.**
Wie schnell das lokale Modell antwortet, hängt von der Grafikkarte ab. Wähle unter **Einstellungen → LLM** ein kleineres Hardware-Profil oder nutze OpenAI. Näheres unter [Hardware](hardware.md).

**Beim Start steht „E.L.L.A. startet nicht“ oder „Einstellungen ließen sich nicht laden“.**
E.L.L.A. hat ihre Einstellungen gerade nicht erreicht – sie sind nicht verloren. Klicke nach einem Moment auf **Erneut prüfen** oder starte E.L.L.A. neu. Bleibt der Bildschirm, hilft das Startprotokoll (siehe unten).

**Oben steht „Das Gedächtnis-Modell fehlt …“.**
Ohne dieses Modell speichert E.L.L.A. keine Erinnerungen und liest keine Dokumente ein. Starte E.L.L.A. mit Internetverbindung neu, dann lädt sie es nach (Kapitel 5).

**Die erste Spracheingabe dauert lange.**
E.L.L.A. lädt dann einmalig die Spracherkennung (rund 945 MB). Der Balken „Spracherkennung wird eingerichtet (einmalig)“ zeigt den Fortschritt. Ohne Internet klappt das nicht; E.L.L.A. versucht es bei der nächsten Spracheingabe erneut (Kapitel 6).

**E.L.L.A. reagiert nicht auf „Ella“.**
Sieh unter **Einstellungen → Tools → Spracheingabe** nach, ob der Modus **Wakeword** gewählt ist und ob dort ein Hinweis steht, warum die Wakeword-Erkennung nicht verfügbar ist.

**E.L.L.A. kann ein Dokument aus dem Dokument-Wissen nicht öffnen.**
Vermutlich wurde es vor Version 1.7.1 hinzugefügt, und die Kopie ist nicht mehr da. Füge es unter **Einstellungen → Tools → Lokales RAG – Dokument-Wissen** noch einmal hinzu (Kapitel 11).

**Eine Einstellung wurde nicht übernommen.**
Viele Einstellungen gelten erst nach einem Klick auf **Speichern** unten auf der Seite. Steht dort „Nicht gespeichert (…)“, nennt die Meldung den Grund. Die Wahl des Anbieters unter **Einstellungen → LLM** gilt sofort.

**Wo steht das Startprotokoll?**

- **Installer-Fassung:** `%APPDATA%\ELLA\ella-startup.log`
- **Store-Fassung:** `%LOCALAPPDATA%\Packages\<Paket>\LocalCache\Roaming\ELLA\ella-startup.log` – `<Paket>` ist der Ordner, dessen Name „E.L.L.A.“ enthält.

Unter **Einstellungen → Über E.L.L.A.** kannst du außerdem die wichtigsten Angaben zu deinem System für eine Support-Anfrage kopieren.

Weitere Antworten stehen in der [FAQ](faq.md).

---

_E.L.L.A. v1.7.1 – Embedded Local Logic Agent_
_Für Windows 10 und 11 (64 Bit)_
