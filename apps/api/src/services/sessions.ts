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
    // Nur die letzten N Nachrichten behalten um Token-Limit zu vermeiden
    store.set(id, messages.slice(-MAX_HISTORY));
  },

  clear: (id: string): void => {
    store.delete(id);
  },
};
