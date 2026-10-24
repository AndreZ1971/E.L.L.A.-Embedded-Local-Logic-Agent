const PATTERNS: Array<{ re: RegExp; replacement: string }> = [
  { re: /\bsk-[a-zA-Z0-9]{20,}\b/g, replacement: "[API-KEY]" },
  { re: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/g, replacement: "[TOKEN]" },
  {
    re: /\b(ghp|gho|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\b/g,
    replacement: "[TOKEN]",
  },
  {
    re: /(token|key|secret|password|passwort|passwd|pwd|kennwort)\s*[:=]\s*(?!\[)\S+/gi,
    replacement: "$1: [GESCHWÄRZT]",
  },
  {
    re: /(?:passwort|password|pwd|pin|kennwort)\s+(?:ist|is|lautet|war|wird|wäre)\s+\S+/gi,
    replacement: "[PASSWORT GESCHWÄRZT]",
  },
  { re: /\bDE\d{20}\b/g, replacement: "[IBAN]" },
  {
    re: /\b[A-Z]{2}\d{2}\s?[A-Z0-9]{4}\s?\d{4}\s?\d{4}\s?\d{4}(?:\s?\d{0,4}){0,3}\b/g,
    replacement: "[IBAN]",
  },
  {
    re: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: "[KARTENNUMMER]",
  },
];

export function redact(text: string): string {
  let result = text;
  for (const { re, replacement } of PATTERNS) {
    re.lastIndex = 0;
    result = result.replace(re, replacement);
  }
  return result;
}
