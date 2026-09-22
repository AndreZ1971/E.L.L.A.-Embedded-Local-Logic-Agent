import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./Memories.css";

interface Memory {
  id: number;
  type: string;
  content: string;
  source: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  user: number;
  system: number;
  note: number;
  reflection: number;
}

const PAGE_SIZE = 50;

const TYPE_LABELS: Record<string, { de: string; en: string; color: string }> = {
  all: { de: "Alle", en: "All", color: "" },
  user: { de: "Nutzer", en: "User", color: "badge-user" },
  system: { de: "System", en: "System", color: "badge-system" },
  note: { de: "Notizen", en: "Notes", color: "badge-note" },
  reflection: {
    de: "Reflexionen",
    en: "Reflections",
    color: "badge-reflection",
  },
};

export default function Memories() {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith("de") ? "de" : "en";

  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [addContent, setAddContent] = useState("");
  const [addType, setAddType] = useState<"user" | "system" | "note">("note");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 350);
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/memories/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (activeType !== "all") params.set("type", activeType);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/memories?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [activeType, debouncedSearch, offset]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset offset when filter changes
  useEffect(() => {
    setOffset(0);
  }, [activeType, debouncedSearch]);

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        setTotal((t) => t - 1);
        fetchStats();
      }
    } finally {
      setDeleteId(null);
    }
  };

  const handleAdd = async () => {
    if (!addContent.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: addType, content: addContent.trim() }),
      });
      if (res.ok) {
        setAddContent("");
        setShowAdd(false);
        setOffset(0);
        fetchMemories();
        fetchStats();
      }
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(lang === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeBadge = (m: Memory) => {
    const t = m.source === "reflection" ? "reflection" : m.type;
    const meta = TYPE_LABELS[t] ?? TYPE_LABELS["note"];
    return { label: meta[lang], cls: meta.color };
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="memories-page">
      <div className="memories-header">
        <h1>{lang === "de" ? "Gedächtnis" : "Memory"}</h1>
        <button className="btn-add" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "✕" : lang === "de" ? "+ Hinzufügen" : "+ Add"}
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="memories-stats">
          {(["all", "user", "system", "note", "reflection"] as const).map(
            (k) => (
              <span
                key={k}
                className={`stat-chip ${activeType === k ? "active" : ""} ${TYPE_LABELS[k].color}`}
                onClick={() => setActiveType(k)}
              >
                {TYPE_LABELS[k][lang]}
                <em>
                  {k === "all"
                    ? stats.total
                    : stats[k as keyof Omit<Stats, "total">]}
                </em>
              </span>
            ),
          )}
        </div>
      )}

      {/* Search */}
      <div className="memories-search">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === "de" ? "Suchen…" : "Search…"}
          className="search-input"
        />
        {search && (
          <button
            className="clear-search"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="add-memory-form">
          <select
            value={addType}
            onChange={(e) =>
              setAddType(e.target.value as "user" | "system" | "note")
            }
          >
            <option value="note">{lang === "de" ? "Notiz" : "Note"}</option>
            <option value="user">{lang === "de" ? "Nutzer" : "User"}</option>
            <option value="system">System</option>
          </select>
          <textarea
            value={addContent}
            onChange={(e) => setAddContent(e.target.value)}
            placeholder={
              lang === "de" ? "Inhalt der Erinnerung…" : "Memory content…"
            }
            rows={3}
          />
          <div className="add-actions">
            <button
              className="btn-save"
              onClick={handleAdd}
              disabled={adding || !addContent.trim()}
            >
              {adding
                ? lang === "de"
                  ? "Speichern…"
                  : "Saving…"
                : lang === "de"
                  ? "Speichern"
                  : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Memory list */}
      <div className="memories-list">
        {loading && <div className="memories-loading">…</div>}
        {!loading && memories.length === 0 && (
          <div className="memories-empty">
            {lang === "de"
              ? "Keine Erinnerungen gefunden."
              : "No memories found."}
          </div>
        )}
        {memories.map((m) => {
          const badge = getTypeBadge(m);
          return (
            <div key={m.id} className="memory-card">
              <div className="memory-meta">
                <span className={`badge ${badge.cls}`}>{badge.label}</span>
                {m.source && m.source !== "reflection" && (
                  <span className="source-tag">{m.source}</span>
                )}
                <span className="memory-date">{formatDate(m.created_at)}</span>
              </div>
              <p className="memory-content">{m.content}</p>
              <button
                className="btn-delete"
                onClick={() => handleDelete(m.id)}
                disabled={deleteId === m.id}
                aria-label={lang === "de" ? "Löschen" : "Delete"}
              >
                {deleteId === m.id ? "…" : "✕"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="memories-pagination">
          <button
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          >
            ←
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
