export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_HISTORY = 40;

const store = new Map<string, HistoryMessage[]>();

export const sessionStore = {
  get: (id: string): HistoryMessage[] => {
    if (!store.has(id)) store.set(id, []);
    return store.get(id)!;
  },

  set: (id: string, messages: HistoryMessage[]): void => {
    // Nur user/assistant behalten — tool-Nachrichten gehören nicht in den Verlauf
    const clean = messages.filter(m => m.role === 'user' || m.role === 'assistant');
    store.set(id, clean.slice(-MAX_HISTORY));
  },

  clear: (id: string): void => {
    store.delete(id);
  },
};
