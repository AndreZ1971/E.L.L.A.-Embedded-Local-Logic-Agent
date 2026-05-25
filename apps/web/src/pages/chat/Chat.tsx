import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type StreamEvent =
  | { type: "chunk"; text: string }
  | { type: "tool"; name: string }
  | { type: "done" }
  | { type: "error"; message: string };

const SESSION_ID = "default";

const TOOL_LABELS: Record<string, string> = {
  get_disk_usage: "Festplattennutzung abrufen",
  open_app: "App öffnen",
  clean_temp: "Temp-Dateien bereinigen",
  empty_recycle_bin: "Papierkorb leeren",
};

const Chat: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState("");
  const [toolStatus, setToolStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chat/history/${SESSION_ID}`)
      .then((r) => r.json())
      .then((data: { messages: Message[] }) => {
        if (data.messages?.length > 0) setMessages(data.messages);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError("");
    setStreaming("");
    setToolStatus("");

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: SESSION_ID }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      mainLoop: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          const event = JSON.parse(raw) as StreamEvent;

          if (event.type === "chunk") {
            fullContent += event.text;
            setStreaming(fullContent);
            setToolStatus("");
          } else if (event.type === "tool") {
            setToolStatus(TOOL_LABELS[event.name] ?? event.name);
          } else if (event.type === "done") {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: fullContent },
            ]);
            setStreaming("");
            setToolStatus("");
            break mainLoop;
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      setStreaming("");
      setToolStatus("");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    await fetch(`/api/chat/history/${SESSION_ID}`, { method: "DELETE" });
    setMessages([]);
    setStreaming("");
    setToolStatus("");
    setError("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Chat</h2>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: "0.8rem",
              background: "transparent",
              border: "1px solid #2d3148",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            Verlauf löschen
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.length === 0 && !loading && (
          <div
            style={{
              color: "#64748b",
              fontSize: "0.9rem",
              marginTop: 32,
              textAlign: "center",
            }}
          >
            Hallo! Ich bin E.L.L.A. — wie kann ich helfen?
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#7c6af7" : "#1a1d27",
              border: m.role === "assistant" ? "1px solid #2d3148" : "none",
              padding: "10px 14px",
              borderRadius: 8,
              maxWidth: "75%",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
          </div>
        ))}

        {toolStatus && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#1a1d27",
              border: "1px solid #2d3148",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: "0.8rem",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "#7c6af7" }}>⚙</span>
            {toolStatus}…
          </div>
        )}

        {streaming && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#1a1d27",
              border: "1px solid #2d3148",
              padding: "10px 14px",
              borderRadius: 8,
              maxWidth: "75%",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {streaming}
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: "1em",
                background: "#7c6af7",
                marginLeft: 2,
                animation: "blink 1s step-end infinite",
                verticalAlign: "text-bottom",
              }}
            />
          </div>
        )}

        {loading && !streaming && !toolStatus && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#1a1d27",
              border: "1px solid #2d3148",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: "0.85rem",
              color: "#7c6af7",
            }}
          >
            E.L.L.A. denkt…
          </div>
        )}

        {error && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#2d1a1a",
              border: "1px solid #7f1d1d",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: "0.85rem",
              color: "#fca5a5",
            }}
          >
            Fehler: {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Anweisung eingeben…"
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #2d3148",
            background: "#1a1d27",
            color: "#e2e8f0",
            fontSize: "0.9rem",
            outline: "none",
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            background: loading || !input.trim() ? "#4a4670" : "#7c6af7",
            color: "#fff",
            border: "none",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
          }}
        >
          Senden
        </button>
      </div>
    </div>
  );
};

export default Chat;
