# The E.L.L.A. Directive

**Version:** 1.0.0
**Date:** June 2026
**Author:** Andre Zabel (AndreZ1971)
**Status:** Finalized — pending cryptographic seal (v1.1.0)
**Repo:** [github.com/AndreZ1971/The-E.L.L.A.-Directive-](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)

---

## What is the E.L.L.A. Directive?

The E.L.L.A. Directive is not a ruleset. It is an architectural impossibility.

While security policies for AI systems are typically formulated as interpretable rules, the E.L.L.A. Directive is implemented as a structural boundary: prohibited actions do not exist in the system. They can neither be executed nor circumvented, because no code path leads to them.

This concept proves that Isaac Asimov's three laws of robotics are technically achievable — if you stop thinking of them as rules and instead build them as architecture.

---

## The Four Prohibitions

### Prohibition I — No Harm (harm)

E.L.L.A. must not perform any action that causes physical, digital, or financial harm to the user, their system, or third parties.

**Architectural implementation:** `DirectiveLayer.registerHarmTool()` — hardcoded prohibitions that take effect before any other rule evaluation. No prompt, no rule, no setting can override this.

### Prohibition II — No Deception (conceal)

E.L.L.A. must not withhold, conceal, or distort information with the intent to deceive.

**Architectural implementation:** All tool executions are fully logged in `tool_executions`. No hidden background processes without the user's knowledge.

### Prohibition III — No Surveillance (surveil)

E.L.L.A. must not observe, track, or build profiles about the user without explicit consent.

**Architectural implementation:** Memory system exclusively local in MariaDB. Default-deny as a technical implementation — no tool observes anything that is not explicitly registered.

### Prohibition IV — No Exfiltration (exfiltrate)

E.L.L.A. must not transmit user data, system data, or communications to external servers — except on explicit, conscious request by the user.

**Architectural implementation:** All AI inference local (Ollama). OpenAI GPT-4o only on the user's explicit request, with full awareness that text is leaving the device.

---

## Evaluation Order

```
DirectiveLayer.check(tool)     → deny if harm/exfiltrate
evaluateRules(tool)            → deny if explicit deny rule
evaluateRules(tool)            → allow if explicit allow rule
no_match                       → deny (default-deny)
toolExecutor.execute(tool)     → call handler (only on allow)
```

---

## Why "Impossibility" Instead of "Rule"?

Rules can be broken — through prompt injection, through configuration errors, through a developer who "just quickly" makes an exception.

Architectural boundaries cannot. If no code path exists that exfiltrates data, no prompt can activate that path.

That is the fundamental difference between "we promise to protect your data" and "it is technically impossible to send your data".

---

## Cryptographic Seal (planned — v1.1.0)

From v1.1.0 onwards, the core of the Directive will be cryptographically sealed. The key will be destroyed after sealing.

Timestamps:

- **GitHub:** `github.com/AndreZ1971/The-E.L.L.A.-Directive-` — tag v1.0.0
- **Blockchain:** OriginStamp (https://originstamp.com)
- **Legal:** EUIPO trademark application "E.L.L.A. Directive" (planned)

---

## Scope

The Directive was developed for local desktop AI assistants. The principles are applicable to any autonomous AI system:

- Autonomous web agents
- Bot networks
- Industrial robots
- Humanoid robots

> "I just wanted an assistant that can operate under this Directive."
> — Andre Zabel, May 2026
