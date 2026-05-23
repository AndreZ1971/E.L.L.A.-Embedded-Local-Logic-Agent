import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SESSION_ID = 'default';

const Chat: React.FC = () => {
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: SESSION_ID }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { reply: string };
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    await fetch(`/api/chat/history/${SESSION_ID}`, { method: 'DELETE' });
    setMessages([]);
    setError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', gap: 12 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Chat</h2>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              padding: '4px 12px', borderRadius: 4, fontSize: '0.8rem',
              background: 'transparent', border: '1px solid #2d3148',
              color: '#64748b', cursor: 'pointer',
            }}
          >
            Verlauf löschen
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && !loading && (
          <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 32, textAlign: 'center' }}>
            Hallo! Ich bin E.L.L.A. — wie kann ich helfen?
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? '#7c6af7' : '#1a1d27',
              border: m.role === 'assistant' ? '1px solid #2d3148' : 'none',
              padding: '10px 14px', borderRadius: 8,
              maxWidth: '75%', fontSize: '0.9rem', lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: 'flex-start', background: '#1a1d27',
            border: '1px solid #2d3148', padding: '10px 14px',
            borderRadius: 8, fontSize: '0.85rem', color: '#7c6af7',
          }}>
            E.L.L.A. denkt…
          </div>
        )}

        {error && (
          <div style={{
            alignSelf: 'flex-start', background: '#2d1a1a',
            border: '1px solid #7f1d1d', padding: '10px 14px',
            borderRadius: 8, fontSize: '0.85rem', color: '#fca5a5',
          }}>
            Fehler: {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Anweisung eingeben…"
          disabled={loading}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 6,
            border: '1px solid #2d3148', background: '#1a1d27',
            color: '#e2e8f0', fontSize: '0.9rem', outline: 'none',
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px', borderRadius: 6,
            background: loading || !input.trim() ? '#4a4670' : '#7c6af7',
            color: '#fff', border: 'none',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Senden
        </button>
      </div>

    </div>
  );
};

export default Chat;
