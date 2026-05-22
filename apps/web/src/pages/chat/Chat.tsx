import React, { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chat: React.FC = () => {
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = (await res.json()) as { reply?: string };
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? '…' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: API not reachable.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', gap: 16 }}>
      <h2>Chat</h2>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#7c6af7' : '#1a1d27',
            border: m.role === 'assistant' ? '1px solid #2d3148' : 'none',
            padding: '10px 14px', borderRadius: 8,
            maxWidth: '75%', fontSize: '0.9rem', lineHeight: 1.5,
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: '#64748b', fontSize: '0.85rem' }}>
            E.L.L.A. denkt…
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Anweisung eingeben…"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 6,
            border: '1px solid #2d3148', background: '#1a1d27',
            color: '#e2e8f0', fontSize: '0.9rem', outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            padding: '10px 20px', borderRadius: 6,
            background: loading ? '#4a4670' : '#7c6af7',
            color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
