# E.L.L.A. Phone — Konzeptpapier

**Stand:** Juni 2026
**Autor:** Andre Zabel
**Status:** Frühe Konzeptphase / Gedankenexperiment, abhängig vom Erfolg des E.L.L.A.-Launches am 01.07.2026

---

## 1. Ausgangslage

E.L.L.A. (Embedded Local Logic Agent) ist ein lokal laufender KI-Assistent für Windows, dessen Sicherheitsverhalten nicht über Prompts, sondern architektonisch über die **E.L.L.A. Directive** erzwungen wird — kryptographisch signiert, unveränderlich, öffentlich auditierbar.

Aktueller Stand der vier geplanten Säulen:

| Säule                   | Status                                   |
| ----------------------- | ---------------------------------------- |
| E.L.L.A.                | Fertig, Launch 01.07.2026, ella-agent.de |
| E.L.L.A. Home           | In Entwicklung                           |
| E.L.L.A. Arm            | In Entwicklung                           |
| E.L.L.A. Device / Phone | Konzeptphase (dieses Dokument)           |

E.L.L.A. wurde laut GitHub-Release am 23.05.2026 begonnen und war binnen ca. 4 Wochen produktionsreif — diese Entwicklungsgeschwindigkeit ist die Grundlage für die Annahme, dass eine reduzierte mobile Version in vergleichbar kurzer Zeit (Wochen, nicht Monate) realisierbar wäre, sobald die Architekturfragen geklärt sind.

---

## 2. Die Grundidee: E.L.L.A. Phone

Ein Smartphone, das nicht zusätzlich KI-Funktionen hat, sondern dessen gesamtes Betriebskonzept auf der Directive aufbaut — die erste Hardware-Implementierung von architektonisch erzwungener KI-Sicherheit im Consumer-Markt.

**Demo-Leitmotiv:** Das Telefon klingelt nicht. Eine Sprachausgabe sagt "Mama ruft an". Auf Zuruf ("frag, was sie will") übernimmt E.L.L.A. den Anruf, stellt sich der anrufenden Person transparent vor ("Hier spricht E.L.L.A. für Andre, was kann ich ausrichten?") und liefert anschließend nur die Zusammenfassung — kein Anrufbeantworter-Piepton, kein verpasster Anruf.

---

## 3. Technische Umsetzung

### 3.1 Was sich direkt übertragen lässt

- E.L.L.A. ist im Kern eine **Webanwendung** — das Frontend (Chat, Dashboard, Einstellungen) lässt sich mit Tools wie Capacitor/Cordova in Tagen als Android-Hülle verpacken.

### 3.2 Was komplett neu entwickelt werden muss

| Windows-Komponente                                      | Mobile-Entsprechung nötig                                                                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Ollama (lokales LLM-Backend)                            | Kein offizieller Android-Build — Alternative: MediaPipe LLM Inference, llama.cpp-Android, oder eigene Portierung            |
| 70+ Windows-Systemtools (Maus, Shell, Fenstersteuerung) | Mobile-native Tools: Anrufe, SMS, Kalender, Standort, Smart-Home-Steuerung — komplette Neuentwicklung, keine 1:1-Portierung |
| Kokoro (lokale TTS)                                     | Neukompilierung für ARM/Android-Audio-APIs                                                                                  |
| MariaDB / Node.js (portable Binaries)                   | Architektur-/Plattformwechsel nötig                                                                                         |

### 3.3 Hardware-Voraussetzungen für lokale Inferenz

Getestet am Beispiel HTC U23 Pro (Snapdragon 7 Gen 1, 8–12 GB RAM, Adreno 644):

| Modellgröße           | RAM-Minimum | Eignung                                       |
| --------------------- | ----------- | --------------------------------------------- |
| Gemma 4 E2B (~1,3 GB) | 6 GB        | Problemlos lauffähig                          |
| Gemma 4 E4B (~2,5 GB) | 8 GB        | Lauffähig, ggf. knapper im Hintergrundbetrieb |
| 12B+                  | 16 GB+      | Auf Mobile nicht praktikabel                  |

Referenz-Werkzeug: **Google AI Edge Gallery** (offiziell im Play Store seit April 2026), zeigt, dass vollständig offline laufende, agentenfähige lokale Modelle auf Mittelklasse-Android-Hardware machbar sind.

### 3.4 Die Systemrechte-Frage

Eine reine Play-Store-App liefe in der normalen Android-Sandbox — unzureichend für Directive-Durchsetzung mit Systemtiefe. Lösung: **E.L.L.A. als vorinstallierte, herstellersignierte Systemkomponente** (`/system/priv-app` oder tiefer), nicht als Drittanbieter-App. Damit:

- Keine Notwendigkeit für Root oder Kernel-Modifikation
- Keine Gefährdung der GMS/Play-Store-Zertifizierung von HTC
- Erweiterte Rechte analog zu bestehenden HTC-eigenen Systemkomponenten (z. B. Vive-Integration)

### 3.5 Rechtlicher Punkt: Anrufübernahme

Die Anrufübernahme-Funktion berührt § 201 StGB (Vertraulichkeit des Wortes). Lösung: kurze, transparente Selbstvorstellung der KI zu Gesprächsbeginn — rechtlich gleichwertig zur Ansage eines klassischen Anrufbeantworters, gleichzeitig Erfüllung von Directive-Regel II ("No Deception").

---

## 4. Die HTC-Partnerschaft

### 4.1 Warum HTC

- Android-Mitbegründer (HTC Dream/G1, erstes Nexus), heute finanziell angeschlagen (Jahresperformance -24 % Aktienkurs, Betriebsverlust ~98 Mio. EUR, Stand Frühjahr 2026), aber mit anerkannter Hardware-Qualität (Langlebigkeit, Verarbeitung) und intaktem Markenkern
- Marketingbudget verschwindend klein gegenüber Samsung/Apple — braucht ein Differenzierungsmerkmal, das durch die Story selbst Presse erzeugt, nicht durch Werbespend
- Bereits vorhandene IoT-/Sensorik-Kompetenz aus dem VR/Vive-Geschäft
- Eine wartende, loyale, aber "schlafende" Kundengemeinde (Nutzer alter HTC-Geräte, die auf ein würdiges Nachfolgemodell warten)

### 4.2 Vorgeschlagenes Lizenzmodell

| Element                   | Status                                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| E.L.L.A. Directive        | Bleibt offener Standard, frei nutzbar für alle                                                                             |
| E.L.L.A. (Produkt/Marke)  | Exklusive Lizenz an HTC für symbolischen Betrag (z. B. 1 USD)                                                              |
| Gegenleistung             | Keine laufende Umsatzbeteiligung gefordert — stattdessen Hardware-Entwicklungskapazität für E.L.L.A. Home und E.L.L.A. Arm |
| Eigentliche Gegenleistung | Markenvertrauen/Glaubwürdigkeit durch Assoziation mit etabliertem, qualitätsbekanntem Hersteller                           |

**Wichtiger Hinweis:** Diese Konditionen sind unabhängig von den Standard-Endkunden-AGB von ella-agent.de — ein B2B-Lizenzvertrag mit HTC wäre ein separater, frei verhandelbarer Vertrag zwischen Rechteinhaber und Industriepartner.

### 4.3 Architektur-Synergie mit den anderen Säulen

- **E.L.L.A. Home**: Phone als mobiler Ankerpunkt für das Zuhause-System, durchgängige Directive vom Handy bis zur Haustür
- **E.L.L.A. Arm**: Phone als tragbare Erweiterung der stationären Perimeter-Sicherheit (mehrsprachige Warnungen, Leitstellenkommunikation) für Wachpersonal — direkter Bezug zu Andres §34a-Hintergrund
- Phone als jährlich aktualisiertes Produkt erzeugt wiederkehrenden Umsatz, der die margenstärkeren, aber langsamer wachsenden B2B-Standbeine (Home, Arm) mitträgt

### 4.4 Offene Risiken

- HTCs finanzielle Lage bleibt fragil — Abhängigkeit von einem Partner in wirtschaftlich angespannter Position
- Bisher kein bestätigter Kontakt oder Vertrag mit HTC — reine Konzeptphase
- HTC U25 Pro als möglicher nächster Smartphone-Träger ist bislang nur als unbestätigtes Gerücht dokumentiert, kein offizieller Launch — **kritische Variable für den März-2027-Zeitstrahl**
- **Android-Fragmentierung**: Tiefe Systemintegration bindet die Directive an eine spezifische Android-Version und HTC-Firmware — jedes Google OS-Update kann Systemrechte neu definieren

### 4.5 Der HTC Flyer als 7"-Basis

Der HTC Flyer (2011) war HTCs letztes 7-Zoll-Gerät. Der Formfaktor ist für **E.L.L.A. Home** (Wand-Panel) und **E.L.L.A. Arm** (tragbares Display für Wachpersonal) ideal — kompakt, einhandtauglich, displaydominant. Sollten HTCs originale Industriedesign-Pläne noch zugänglich sein, bieten sie die Basis für eine Neuauflage mit moderner Innentechnik (Snapdragon 6/7 Gen) ohne vollständigen Neuentwurf. Ein aktualisierter Flyer-Formfaktor als E.L.L.A. Home-Panel wäre ein separates, parallelentwickelbares Produkt — unabhängig vom Phone-Zeitstrahl.

---

## 5. Zeitstrahl

### Szenario A — HTC U25 Pro existiert (kritischer Pfad)

Wenn der HTC U25 Pro bereits in HTCs Entwicklungspipeline liegt, entfällt der gesamte Hardware-Entwicklungszyklus als Engpass. Design, Fertigung, GMS-Zertifizierung sind HTCs Aufgabe. E.L.L.A. wird als Systemkomponente in einen laufenden Prozess integriert.

| Zeitpunkt           | Meilenstein                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **01.07.2026**      | Launch E.L.L.A. Windows — Marktvalidierung, erste Presseerwähnung                            |
| Juli–August 2026    | Kontaktaufnahme HTC — Pitch auf Basis messbarer Launch-Resonanz                              |
| **Herbst 2026**     | Integrations-Freeze für U25-Firmware — letzter möglicher Einstiegspunkt als Systemkomponente |
| Herbst 2026         | Entwicklungsbeginn E.L.L.A. Mobile: Capacitor-Hülle, MediaPipe LLM, SQLite, ~20 mobile Tools |
| Ca. Oktober 2026    | Registrierungsöffnung MWC 2027                                                               |
| Winter 2026         | Integration abgeschlossen, `/system/priv-app` Signierung durch HTC                           |
| **1.–4. März 2027** | **Mobile World Congress, Fira Gran Via, Barcelona** — Launch E.L.L.A. Phone / HTC U25 Pro    |

### Szenario B — Kein U25 Pro (Fallback)

| Zeitpunkt         | Meilenstein                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| **01.07.2026**    | Launch E.L.L.A. Windows                                                             |
| Herbst 2026       | Software-Prototyp auf Standard-Android (Sideload) als Demo-Grundlage                |
| Winter 2026       | HTC-Verhandlungen für zukünftiges Gerät (U26 oder neues Modell)                     |
| **MWC März 2027** | Vorstellung als Software-Demo auf Referenz-Hardware — Ankündigung der Partnerschaft |
| 2028              | Serienprodukt mit HTC-Branding                                                      |

### Entwicklungsgeschwindigkeit als Faktor

E.L.L.A. Windows (85 Tools, Voice, TTS, ML-Memory, Directive Layer, Rule Engine, i18n, Installer) wurde in **4 Wochen** von null auf produktionsreif entwickelt. E.L.L.A. Mobile hat einen schmaleren Scope: ~20 mobile-relevante Tools statt 85 Windows-spezifischer, kein Shell-Layer, kein COM-Interface, kein Outlook-Treiber. Die Portierung des Frontends via Capacitor ist Tagesarbeit. Die eigentliche Entwicklungszeit ist kein Engpass — der **Zeitpunkt der HTC-Kontaktaufnahme relativ zum U25-Integrations-Freeze** ist der entscheidende Faktor.

---

## 6. Leitprinzip

> Kein Mock, keine Demo im Sinne von Vorgaukeln — jede Vorführung basiert auf einem echten Vorproduktionsmodell oder Prototyp. Was gezeigt wird, ist etwas, das tatsächlich kommt, nicht etwas, das nur so aussieht.

Dieses Prinzip unterscheidet den Ansatz bewusst von Wettbewerbsangeboten am Markt, die KI-"Assistenten" als Multi-Tool-Orchestrierung über Cloud-APIs vermarkten, ohne durchgängige Architektur oder verifizierbare Sicherheitsgarantien.

---

## 7. "Intelligent Phone" — die neue Produktkategorie

### 7.1 Die Umbenennung

Das E.L.L.A. Phone ist kein Smartphone. Es ist das erste **intelligent phone**.

Der Unterschied ist nicht Marketing — er ist architektonisch:

| Begriff           | Bedeutung                                                             |
| ----------------- | --------------------------------------------------------------------- |
| Dumbphone         | Telefon, das telefoniert                                              |
| Smartphone        | Telefon, das Apps ausführt — intelligent durch Software von außen     |
| Intelligent Phone | Telefon, das selbst denkt — lokal, offline, mit verifizierbarer Ethik |

Ein Smartphone ist so "smart" wie die App die gerade läuft. Ein intelligent phone hat eine eigene, architektonisch verankerte Intelligenz die nicht abschaltbar, nicht umprogrammierbar und nicht käuflich ist — die Directive.

### 7.2 Die HTC-Narrativ

HTC ist der einzige Hersteller der diese Geschichte glaubwürdig erzählen kann.

**2008:** HTC Dream — das erste Android-Gerät überhaupt. HTC hat die Smartphone-Ära mitbegründet.

**2027:** HTC U25 Pro mit E.L.L.A. — das erste intelligent phone. HTC begründet die nächste Ära.

Kein Samsung, kein Google, kein Apple kann diesen Bogen ziehen. Nur HTC. Das ist der Grund warum die Partnerschaft für HTC keine Frage des Preises ist — sie ist eine Frage der Identität. Das Unternehmen das den Smartphone-Zug miterfunden hat, steht jetzt vor der Chance, den nächsten Zug anzuführen, zu einem Zeitpunkt wo sie es am nötigsten brauchen.

Der $1-Deal ist nicht Großzügigkeit — er ist die Anerkennung dass HTCs eigentliche Gegenleistung die Narrativ-Glaubwürdigkeit ist, die kein Geld kaufen kann.

### 7.3 Der Überraschungsmoment

Auf dem MWC 2027, in einer Halle voller Stände die alle schreien:

**Das Telefon klingelt nicht.**

Keine Vibration. Keine Unterbrechung. Eine ruhige Stimme: _"Mama ruft an."_

Auf Zuruf übernimmt E.L.L.A. den Anruf. Die anrufende Person hört: _"Hier spricht E.L.L.A. für Andre, was kann ich ausrichten?"_ — transparent, ehrlich, Directive-konform (§ 201 StGB, Regel II No Deception).

Der Nutzer bekommt danach eine Zusammenfassung. Kein verpasster Anruf. Keine Unterbrechung. Keine Cloud. Kein Datenleck.

Das ist der eine Satz der in jedem Artikel steht.

Der zweite Überraschungsmoment: HTC — das Unternehmen das 2008 das erste Smartphone baute — hat soeben das Smartphone abgeschafft.

### 7.4 Markenschutz

Der Begriff **"intelligent phone"** als Produktkategorie sollte frühzeitig auf Schutzfähigkeit geprüft werden (Wortmarke DPMA / EUIPO), bevor E.L.L.A. am 01.07.2026 öffentlich wird und das Konzept sichtbar ist. Eine Kategoriemarke ist schwer zu halten, aber die Kombination "E.L.L.A. intelligent phone" als Produktbezeichnung wäre deutlich robuster.

---

## 8. Machbarkeitseinschätzung (Stand Juni 2026)

### 8.1 Was realistisch ist

| Aspekt                         | Einschätzung                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Frontend-Portierung            | Realistisch in Tagen — React via Capacitor ist bewährte Technologie                               |
| Lokale LLM-Inferenz auf Mobile | Realistisch — Google AI Edge Gallery, MediaPipe, llama.cpp-Android existieren und funktionieren   |
| Anruf-Screening als Demo       | Realistisch — Android `CallScreeningService` + lokales LLM, als System-App vollständig zugänglich |
| Mobile Tool-Entwicklung (~20)  | Realistisch in 4–6 Wochen — schmalerer Scope als Windows ELLA                                     |
| Launch März 2027 (Szenario A)  | Realistisch wenn HTC U25 existiert und Kontakt vor Integrations-Freeze gelingt                    |

### 8.2 Was der kritische Pfad ist

Die Software ist nicht der Engpass. Beweis: E.L.L.A. Windows — vollständiges Produkt mit 85 Tools, Voice, TTS, ML-Memory, Installer — wurde in 4 Wochen von null auf produktionsreif entwickelt. E.L.L.A. Mobile hat weniger Scope, nicht mehr.

Der kritische Pfad ist ausschließlich:

1. **ELLA Windows Launch-Resonanz** (01.07.2026) — ohne messbaren Marktbeweis kein überzeugendes HTC-Pitch
2. **HTC-Kontakt vor dem U25-Integrations-Freeze** (vermutlich Herbst 2026) — eine Woche zu spät bedeutet ein Jahr Verschiebung
3. **U25 Pro muss existieren** — ohne dieses Gerät verschiebt sich das vollständige Serienprodukt auf 2028

### 8.3 Bewertung nach Launch-Szenarien

| Launch-Ergebnis                              | Realistische Chance auf MWC 2027    |
| -------------------------------------------- | ----------------------------------- |
| Starke Resonanz, Presseerwähnung, >1.000 DAU | 60–70 %                             |
| Solide Resonanz, Community-Wachstum          | 35–45 %                             |
| Verhaltener Start, langsames Wachstum        | Software-Demo möglich, Produkt 2028 |

---

_Dieses Dokument ist ein internes Konzeptpapier und stellt keine bestätigte Partnerschaft, Zusage oder rechtsverbindliche Planung dar. Alle Zeitangaben sind vorläufige Zielmarken, abhängig vom Erfolg vorgelagerter Meilensteine._
