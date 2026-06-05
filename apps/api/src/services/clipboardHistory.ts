const MAX_HISTORY = 20;
const history: Array<{ content: string; timestamp: string }> = [];

export function recordClipboard(content: string): void {
  if (history[0]?.content === content) return;
  history.unshift({
    content: content.slice(0, 5000),
    timestamp: new Date().toISOString(),
  });
  if (history.length > MAX_HISTORY) history.pop();
}

export function getClipboardHistory(): Array<{
  content: string;
  timestamp: string;
}> {
  return [...history];
}

export function getLastClipboard(): string | null {
  return history[0]?.content ?? null;
}
