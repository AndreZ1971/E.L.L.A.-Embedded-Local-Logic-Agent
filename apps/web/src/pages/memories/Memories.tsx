import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../lib/api";
import MemoryGraph from "./MemoryGraph";
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
  const { t, i18n } = useTranslation();
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
  const [view, setView] = useState<"list" | "graph">("list");
  const [deduping, setDeduping] = useState(false);
  const [dedupResult, setDedupResult] = useState<string | null>(null);
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
      const res = await apiFetch("/api/memories/stats");
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
      const res = await apiFetch(`/api/memories?${params}`);
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
      const res = await apiFetch(`/api/memories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        setTotal((t) => t - 1);
        fetchStats();
      }
    } finally {
      setDeleteId(null);
    }
  };

  const handleDeduplicate = async () => {
    setDeduping(true);
    setDedupResult(null);
    try {
      const res = await apiFetch("/api/memories/deduplicate", {
        method: "POST",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          removed: number;
          kept: number;
        };
        setDedupResult(
          lang === "de"
            ? `${data.removed} Duplikate entfernt, ${data.kept} behalten.`
            : `${data.removed} duplicates removed, ${data.kept} kept.`,
        );
        fetchMemories();
        fetchStats();
      }
    } finally {
      setDeduping(false);
    }
  };

  const handleAdd = async () => {
    if (!addContent.trim()) return;
    setAdding(true);
    try {
      const res = await apiFetch("/api/memories", {
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
    <div
      className={`memories-page${view === "graph" ? " memories-page--graph" : ""}`}
    >
      <div className="memories-header">
        <h1>{t("memories.heading")}</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
              title={t("memories.view_list")}
            >
              ☰
            </button>
            <button
              className={view === "graph" ? "active" : ""}
              onClick={() => setView("graph")}
              title={t("memories.view_graph")}
            >
              ◉
            </button>
          </div>
          {view === "list" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-add"
                onClick={handleDeduplicate}
                disabled={deduping}
                title={
                  lang === "de" ? "Duplikate entfernen" : "Remove duplicates"
                }
                style={{ opacity: deduping ? 0.5 : 1 }}
              >
                {deduping
                  ? "⏳"
                  : lang === "de"
                    ? "🧹 Aufräumen"
                    : "🧹 Clean up"}
              </button>
              <button className="btn-add" onClick={() => setShowAdd((v) => !v)}>
                {showAdd ? "✕" : t("memories.add_btn")}
              </button>
            </div>
          )}
        </div>
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

      {dedupResult && (
        <div
          style={{
            background: "#1a2e1a",
            border: "1px solid #2d5a2d",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: "0.85rem",
            color: "#4ade80",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>✓ {dedupResult}</span>
          <button
            onClick={() => setDedupResult(null)}
            style={{
              background: "none",
              border: "none",
              color: "#4ade80",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search */}
      <div className="memories-search">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("memories.search_placeholder")}
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

      {/* Graph view */}
      {view === "graph" && <MemoryGraph lang={lang} />}

      {/* List view only below */}
      {view === "list" && (
        <>
          {/* Add form */}
          {showAdd && (
            <div className="add-memory-form">
              <select
                value={addType}
                onChange={(e) =>
                  setAddType(e.target.value as "user" | "system" | "note")
                }
              >
                <option value="note">{t("memories.type_note")}</option>
                <option value="user">{t("memories.type_user")}</option>
                <option value="system">System</option>
              </select>
              <textarea
                value={addContent}
                onChange={(e) => setAddContent(e.target.value)}
                placeholder={t("memories.content_placeholder")}
                rows={3}
              />
              <div className="add-actions">
                <button
                  className="btn-save"
                  onClick={handleAdd}
                  disabled={adding || !addContent.trim()}
                >
                  {adding ? t("memories.saving") : t("memories.save")}
                </button>
              </div>
            </div>
          )}

          {/* Memory list */}
          <div className="memories-list">
            {loading && <div className="memories-loading">…</div>}
            {!loading && memories.length === 0 && (
              <div className="memories-empty">{t("memories.empty")}</div>
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
                    <span className="memory-date">
                      {formatDate(m.created_at)}
                    </span>
                  </div>
                  <p className="memory-content">{m.content}</p>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(m.id)}
                    disabled={deleteId === m.id}
                    aria-label={t("memories.delete_aria")}
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
        </>
      )}
    </div>
  );
}
