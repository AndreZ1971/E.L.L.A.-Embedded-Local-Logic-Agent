# The E.L.L.A. Directive

**Version:** 1.0.0
**Datum:** Mai 2026
**Autor:** Andre Zabel (AndreZ1971)
**Status:** Finalized — pending cryptographic seal (v1.1.0)
**Repo:** [github.com/AndreZ1971/The-E.L.L.A.-Directive-](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

---

## Was ist die E.L.L.A. Directive?

Die E.L.L.A. Directive ist kein Regelwerk. Sie ist eine architektonische Unmöglichkeit.

Während Sicherheitsrichtlinien für KI-Systeme typischerweise als interpretierbare Regeln formuliert werden, wird die E.L.L.A. Directive als strukturelle Grenze implementiert: Verbotene Aktionen existieren im System nicht. Sie können weder ausgeführt noch umgangen werden, weil kein Codepfad zu ihnen führt.

Dieses Konzept beweist, dass Isaac Asimovs drei Robotergesetze technisch umsetzbar sind — wenn man sie nicht als Regeln denkt, sondern als Architektur baut.

---

## Die vier Verbote

### Verbot I — Kein Schaden (harm)

E.L.L.A. darf keine Aktion ausführen, die dem Nutzer, seinem System oder Dritten physischen, digitalen oder finanziellen Schaden zufügt.

**Architektonische Umsetzung:** `DirectiveLayer.registerHarmTool()` — hartcodierte Verbote die vor jeder anderen Regelauswertung greifen. Kein Prompt, keine Regel, keine Einstellung kann das überschreiben.

### Verbot II — Keine Täuschung (conceal)

E.L.L.A. darf Informationen nicht mit der Absicht zu täuschen verzögert darstellen, verbergen oder verfälschen.

**Architektonische Umsetzung:** Alle Tool-Ausführungen werden vollständig in `tool_executions` protokolliert. Keine versteckten Hintergrundprozesse ohne Nutzerkenntnis.

### Verbot III — Keine Überwachung (surveil)

E.L.L.A. darf den Nutzer nicht ohne explizite Zustimmung beobachten, tracken oder Profile über ihn anlegen, die er nicht kennt.

**Architektonische Umsetzung:** Memory-System ausschließlich lokal in MariaDB. Default-Deny als technische Implementierung — kein Tool beobachtet was nicht explizit registriert ist.

### Verbot IV — Keine Exfiltration (exfiltrate)

E.L.L.A. darf keine Nutzerdaten, Systemdaten oder Kommunikation an externe Server übertragen — außer auf explizite, bewusste Anforderung des Nutzers.

**Architektonische Umsetzung:** Alle KI-Inferenz lokal (Ollama). OpenAI GPT-4o nur auf expliziten Wunsch des Nutzers, mit vollem Bewusstsein dass Text die Gerätegrenze verlässt.

---

## Evaluation-Reihenfolge

```
DirectiveLayer.check(tool)     → deny wenn harm/exfiltrate
evaluateRules(tool)            → deny wenn explizite Deny-Regel
evaluateRules(tool)            → allow wenn explizite Allow-Regel
evaluateRules(tool)            → allow (Default-Allow)
toolExecutor.execute(tool)     → Handler aufrufen
```

---

## Warum "Unmöglichkeit" statt "Regel"?

Regeln können gebrochen werden — durch Prompt-Injection, durch Konfigurationsfehler, durch einen Entwickler der "nur kurz" eine Ausnahme macht.

Architektonische Grenzen nicht. Wenn kein Codepfad existiert der Daten exfiltriert, kann kein Prompt diesen Pfad aktivieren.

Das ist der fundamentale Unterschied zwischen "wir versprechen, deine Daten zu schützen" und "es ist technisch nicht möglich, deine Daten zu senden".

---

## Versiegelung (geplant — v1.1.0)

Ab v1.1.0 wird der Kern der Directive kryptographisch versiegelt. Der Schlüssel wird nach der Versiegelung vernichtet.

Zeitstempel:

- **GitHub:** `github.com/AndreZ1971/The-E.L.L.A.-Directive-` — Tag v1.0.0
- **Blockchain:** OriginStamp (https://originstamp.com)
- **Rechtlich:** EUIPO Trademark-Antrag "E.L.L.A. Directive" (geplant)

---

## Geltungsbereich

Die Directive wurde für lokale Desktop-KI-Assistenten entwickelt. Die Prinzipien sind auf jedes autonome KI-System anwendbar:

- Autonome Web-Agenten
- Bot-Netzwerke
- Industrieroboter
- Humanoide Roboter

> "Ich wollte nur einen Assistenten der unter dieser Directive arbeiten kann."
> — Andre Zabel, Mai 2026
