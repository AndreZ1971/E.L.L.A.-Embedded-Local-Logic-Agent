# Security Policy — E.L.L.A.

## Supported Versions

| Version | Supported              |
| ------- | ---------------------- |
| 1.4.x   | ✅ Active              |
| 1.3.x   | ⚠️ Critical fixes only |
| < 1.3   | ❌ No longer supported |

## Reporting a Vulnerability

If you discover a security vulnerability in E.L.L.A., please report it **privately** before public disclosure.

**Contact:** security@ella-agent.de

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your suggested fix (optional)

You will receive a response within 72 hours. We do not operate a bug bounty program, but all valid reports are credited in the release notes unless you prefer to remain anonymous.

**Please do not open a public GitHub issue for security vulnerabilities.**

## The E.L.L.A. Directive

E.L.L.A.'s four core prohibitions (harm, conceal, surveil, exfiltrate) are implemented as architectural constraints, not policy rules. They cannot be bypassed via prompt injection, configuration, or software updates — no code path leads to the prohibited actions.

The Directive is cryptographically sealed and publicly auditable:
[github.com/AndreZ1971/The-E.L.L.A.-Directive-](https://github.com/AndreZ1971/The-E.L.L.A.-Directive-)
