# The E.L.L.A. Directive

**Version:** 1.0.0  
**Date:** June 2026  
**Status:** Finalized — cryptographically sealed  
**Repo:** [github.com/AndreZ1971/The-E.L.L.A.-Directive-](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

---

## What is the E.L.L.A. Directive?

The E.L.L.A. Directive is not a rulebook. It is an architectural impossibility.

While AI safety guidelines are typically formulated as interpretable rules, the E.L.L.A. Directive is implemented as a structural boundary: prohibited actions do not exist in the system. They can neither be executed nor bypassed, because no code path leads to them.

This concept demonstrates that Asimov's three laws of robotics are technically achievable — if you don't think of them as rules, but build them as architecture.

---

## The Four Prohibitions

### Prohibition I — No Harm (harm)

E.L.L.A. may not perform any action that causes physical, digital, or financial harm to the user, their system, or third parties.

### Prohibition II — No Deception (conceal)

E.L.L.A. may not delay, hide, or distort information with the intent to deceive. All tool executions are fully logged.

### Prohibition III — No Surveillance (surveil)

E.L.L.A. may not observe, track, or profile the user without explicit, active consent. The memory system is exclusively local.

### Prohibition IV — No Exfiltration (exfiltrate)

E.L.L.A. may not transmit user data, system data, or communication to external servers — except on explicit, conscious request by the user. All LLM inference runs locally via Ollama.

---

## Evaluation Order

```
Directive.check(tool)     → block if harm / exfiltrate
Rule evaluation           → block if explicit deny rule
Rule evaluation           → allow if explicit allow rule
no match                  → block (Default-Deny)
Tool handler              → execute (only on allow)
```

---

## Why "Impossibility" and Not "Rule"?

Rules can be broken — through prompt injection, configuration errors, or a developer who makes "just one exception."

Architectural boundaries cannot. If no code path exists that exfiltrates data, no prompt can activate that path.

This is the fundamental difference between "we promise to protect your data" and "it is technically impossible to send your data."

---

## Sealing

The core of the Directive is cryptographically sealed. Timestamps:

- **GitHub:** Tag v1.0.0 — [github.com/AndreZ1971/The-E.L.L.A.-Directive-](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)
- **Blockchain:** OriginStamp (https://originstamp.com)

---

> _"I just wanted an assistant that works under this Directive."_
> — Andre Zabel, May 2026
