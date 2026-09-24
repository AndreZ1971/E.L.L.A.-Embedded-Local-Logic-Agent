# Die E.L.L.A. Directive

**Version:** 1.0.0  
**Datum:** Juni 2026  
**Status:** Finalized — kryptographisch versiegelt  
**Repo:** [github.com/AndreZ1971/The-E.L.L.A.-Directive-](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

---

## Was ist die E.L.L.A. Directive?

Die E.L.L.A. Directive ist kein Regelwerk. Sie ist eine architektonische Unmöglichkeit.

Während Sicherheitsrichtlinien für KI-Systeme typischerweise als interpretierbare Regeln formuliert werden, ist die E.L.L.A. Directive als strukturelle Grenze implementiert: Verbotene Aktionen existieren im System nicht. Sie können weder ausgeführt noch umgangen werden, weil kein Codepfad zu ihnen führt.

Dieses Konzept beweist, dass Asimovs drei Robotergesetze technisch umsetzbar sind — wenn man sie nicht als Regeln denkt, sondern als Architektur baut.

---

## Die vier Verbote

### Verbot I — Kein Schaden (harm)

E.L.L.A. darf keine Aktion ausführen, die dem Nutzer, seinem System oder Dritten physischen, digitalen oder finanziellen Schaden zufügt.

### Verbot II — Keine Täuschung (conceal)

E.L.L.A. darf Informationen nicht mit der Absicht zu täuschen verzögert darstellen, verbergen oder verfälschen. Alle Tool-Ausführungen werden vollständig protokolliert.

### Verbot III — Keine Überwachung (surveil)

E.L.L.A. darf den Nutzer nicht ohne explizite Zustimmung beobachten, tracken oder Profile über ihn anlegen, die er nicht kennt. Das Gedächtnis-System ist ausschließlich lokal.

### Verbot IV — Keine Exfiltration (exfiltrate)

E.L.L.A. darf keine Nutzerdaten, Systemdaten oder Kommunikation an externe Server übertragen — außer auf explizite, bewusste Anforderung des Nutzers. Alle KI-Inferenz läuft lokal über Ollama.

---

## Evaluation-Reihenfolge

```
Directive.check(tool)     → blockieren wenn harm / exfiltrate
Regelauswertung           → blockieren wenn explizite Deny-Regel
Regelauswertung           → erlauben wenn explizite Allow-Regel
kein Treffer              → blockieren (Default-Deny)
Tool-Handler              → ausführen (nur bei allow)
```

---

## Warum "Unmöglichkeit" statt "Regel"?

Regeln können gebrochen werden — durch Prompt-Injection, durch Konfigurationsfehler, durch einen Entwickler der "nur kurz" eine Ausnahme macht.

Architektonische Grenzen nicht. Wenn kein Codepfad existiert der Daten exfiltriert, kann kein Prompt diesen Pfad aktivieren.

Das ist der fundamentale Unterschied zwischen "wir versprechen, deine Daten zu schützen" und "es ist technisch nicht möglich, deine Daten zu senden".

---

## Versiegelung

Der Kern der Directive ist kryptographisch versiegelt. Zeitstempel:

- **GitHub:** Tag v1.0.0 — [github.com/AndreZ1971/The-E.L.L.A.-Directive-](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)
- **Blockchain:** OriginStamp (https://originstamp.com)

---

> _"Ich wollte nur einen Assistenten der unter dieser Directive arbeiten kann."_
> — Andre Zabel, Mai 2026
