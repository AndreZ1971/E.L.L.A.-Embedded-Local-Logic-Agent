import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface MemNode {
  id: number;
  type: string;
  content: string;
  source: string | null;
  created_at: string;
}
interface MemEdge {
  source: number;
  target: number;
  weight: number;
}
interface GraphData {
  nodes: MemNode[];
  edges: MemEdge[];
}

interface SimNode extends d3.SimulationNodeDatum {
  uid: string;
  kind: "hub" | "memory";
  memType: string;
  label: string;
  radius: number;
  // memory-only
  memId?: number;
  content?: string;
  source?: string | null;
  created_at?: string;
}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  linkType: "hub" | "semantic" | "session";
  weight: number;
}

const COLOR: Record<string, string> = {
  user: "#f97316",
  system: "#f59e0b",
  note: "#10b981",
  reflection: "#a78bfa",
  hub: "#8b5cf6",
};
const HUB_LABEL_DE: Record<string, string> = {
  user: "Nutzer",
  system: "System",
  note: "Notiz",
  reflection: "Reflexion",
};

interface Props {
  lang: "de" | "en";
}

export default function MemoryGraph({ lang }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<SimNode | null>(null);
  const [status, setStatus] = useState<"loading" | "empty" | "ok" | "error">(
    "loading",
  );
  const [errMsg, setErrMsg] = useState("");

  // Stable render ref so we can call it after resize
  const renderRef = useRef<(data: GraphData) => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/memories/graph");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as GraphData;
        if (cancelled) return;
        if (data.nodes.length === 0) {
          setStatus("empty");
          return;
        }
        setStatus("ok");
        renderRef.current(data);
      } catch (e) {
        if (!cancelled) {
          setErrMsg(String(e));
          setStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    renderRef.current = (data: GraphData) =>
      buildGraph(data, svgRef, lang, setSelected);
  }, [lang]);

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString(lang === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const usedTypes = selected ? [] : [];
  void usedTypes;

  return (
    <div className="graph-container">
      {status === "loading" && (
        <div className="graph-overlay">
          {lang === "de"
            ? "Berechne semantisches Netz…"
            : "Computing semantic graph…"}
        </div>
      )}
      {status === "empty" && (
        <div className="graph-overlay">
          {lang === "de"
            ? "Noch keine Erinnerungen vorhanden."
            : "No memories yet."}
        </div>
      )}
      {status === "error" && (
        <div className="graph-overlay graph-error">{errMsg}</div>
      )}

      <svg ref={svgRef} className="graph-svg" />

      {/* Legend — only non-empty types */}
      <div className="graph-legend">
        {Object.entries(COLOR)
          .filter(([k]) => k !== "hub")
          .map(([t, col]) => (
            <span key={t} className="legend-item">
              <span className="legend-dot" style={{ background: col }} />
              {lang === "de"
                ? HUB_LABEL_DE[t]
                : t[0].toUpperCase() + t.slice(1)}
            </span>
          ))}
      </div>

      {/* Info panel */}
      {selected && selected.kind === "memory" && (
        <div className="graph-panel">
          <button className="panel-close" onClick={() => setSelected(null)}>
            ✕
          </button>
          <div
            className="panel-badge"
            style={{ background: COLOR[selected.memType] ?? COLOR.hub }}
          >
            {lang === "de"
              ? (HUB_LABEL_DE[selected.memType] ?? selected.memType)
              : selected.memType}
          </div>
          {selected.source && (
            <div className="panel-source">{selected.source}</div>
          )}
          <p className="panel-content">{selected.content}</p>
          <div className="panel-date">{formatDate(selected.created_at)}</div>
        </div>
      )}
    </div>
  );
}

// ─── graph builder ────────────────────────────────────────────────────────────

function buildGraph(
  data: GraphData,
  svgRef: React.RefObject<SVGSVGElement | null>,
  lang: "de" | "en",
  setSelected: (n: SimNode | null) => void,
) {
  const el = svgRef.current;
  if (!el) return;

  const W = el.clientWidth || 900;
  const H = el.clientHeight || 560;

  d3.select(el).selectAll("*").remove();

  // ── 1. Derive effective type for each memory ──────────────────────────────
  const effectiveType = (m: MemNode) =>
    m.source === "reflection" ? "reflection" : m.type;

  // ── 2. Hub nodes — only for types that exist ──────────────────────────────
  const presentTypes = [...new Set(data.nodes.map(effectiveType))];
  const hubNodes: SimNode[] = presentTypes.map((t) => ({
    uid: `hub_${t}`,
    kind: "hub",
    memType: t,
    label:
      lang === "de" ? (HUB_LABEL_DE[t] ?? t) : t[0].toUpperCase() + t.slice(1),
    radius: 26,
  }));

  // ── 3. Memory nodes ───────────────────────────────────────────────────────
  const memNodes: SimNode[] = data.nodes.map((m) => ({
    uid: `mem_${m.id}`,
    kind: "memory",
    memType: effectiveType(m),
    label: m.content.slice(0, 32) + (m.content.length > 32 ? "…" : ""),
    radius: 9,
    memId: m.id,
    content: m.content,
    source: m.source,
    created_at: m.created_at,
  }));

  const nodeById = new Map<string, SimNode>();
  [...hubNodes, ...memNodes].forEach((n) => nodeById.set(n.uid, n));

  const nodes: SimNode[] = [...hubNodes, ...memNodes];

  // ── 4. Links ──────────────────────────────────────────────────────────────
  const links: SimLink[] = [];

  // Each memory → its type hub
  memNodes.forEach((n) =>
    links.push({
      source: n.uid,
      target: `hub_${n.memType}`,
      linkType: "hub",
      weight: 1,
    }),
  );

  // Hubs ↔ hubs (keeps the graph connected when types differ)
  for (let i = 0; i < hubNodes.length - 1; i++) {
    links.push({
      source: hubNodes[i].uid,
      target: hubNodes[i + 1].uid,
      linkType: "hub",
      weight: 0.1,
    });
  }

  // Semantic edges from server
  const memUid = (id: number) => `mem_${id}`;
  data.edges.forEach((e) =>
    links.push({
      source: memUid(e.source),
      target: memUid(e.target),
      linkType: "semantic",
      weight: e.weight,
    }),
  );

  // Session edges (same session:xxx source)
  const bySession: Record<string, SimNode[]> = {};
  memNodes.forEach((n) => {
    if (n.source?.startsWith("session:")) {
      const k = n.source;
      if (!bySession[k]) bySession[k] = [];
      bySession[k].push(n);
    }
  });
  Object.values(bySession).forEach((grp) => {
    for (let i = 0; i < grp.length - 1; i++)
      links.push({
        source: grp[i].uid,
        target: grp[i + 1].uid,
        linkType: "session",
        weight: 0.4,
      });
  });

  // ── 5. SVG ────────────────────────────────────────────────────────────────
  const svg = d3.select(el).attr("width", W).attr("height", H);

  // Glow filter for hubs
  const defs = svg.append("defs");
  const filter = defs
    .append("filter")
    .attr("id", "glow")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");
  filter
    .append("feGaussianBlur")
    .attr("stdDeviation", "5")
    .attr("result", "blur");
  const fm = filter.append("feMerge");
  fm.append("feMergeNode").attr("in", "blur");
  fm.append("feMergeNode").attr("in", "SourceGraphic");

  const g = svg.append("g");

  // Zoom
  svg.call(
    d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on("zoom", (ev) => g.attr("transform", ev.transform.toString())),
  );

  // ── 6. Simulation ─────────────────────────────────────────────────────────
  const sim = d3
    .forceSimulation<SimNode>(nodes)
    .force(
      "link",
      d3
        .forceLink<SimNode, SimLink>(links)
        .id((d) => d.uid)
        .strength((d) => {
          if (d.linkType === "hub") return 0.7;
          if (d.linkType === "session") return 0.5;
          return 0.15 + (d.weight - 0.45) * 0.5; // semantic: 0.15–0.40
        })
        .distance((d) => {
          if (d.linkType === "hub") {
            const src = d.source as SimNode;
            return src.kind === "hub" ? 140 : 70;
          }
          if (d.linkType === "semantic") return 60 + (1 - d.weight) * 80;
          return 50;
        }),
    )
    .force(
      "charge",
      d3
        .forceManyBody<SimNode>()
        .strength((d) => (d.kind === "hub" ? -350 : -45)),
    )
    .force("center", d3.forceCenter(W / 2, H / 2).strength(0.05))
    .force(
      "collision",
      d3
        .forceCollide<SimNode>()
        .radius((d) => d.radius + 5)
        .strength(0.9),
    );

  // ── 7. Render links ───────────────────────────────────────────────────────
  const linkEl = g
    .append("g")
    .selectAll<SVGLineElement, SimLink>("line")
    .data(links)
    .join("line")
    .attr("stroke", (d) => {
      if (d.linkType === "hub") return "#ffffff18";
      if (d.linkType === "session") return "#ffffff30";
      return "#ffffff40";
    })
    .attr("stroke-width", (d) => {
      if (d.linkType === "hub") return 0.8;
      if (d.linkType === "session") return 1;
      return 0.6 + d.weight * 1.4; // semantic: thicker = more similar
    })
    .attr("stroke-dasharray", (d) =>
      d.linkType === "semantic" ? "none" : "none",
    );

  // ── 8. Render nodes ───────────────────────────────────────────────────────
  const nodeEl = g
    .append("g")
    .selectAll<SVGGElement, SimNode>("g")
    .data(nodes)
    .join("g")
    .attr("cursor", "pointer")
    .call(
      d3
        .drag<SVGGElement, SimNode>()
        .on("start", (ev, d) => {
          if (!ev.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (ev, d) => {
          d.fx = ev.x;
          d.fy = ev.y;
        })
        .on("end", (ev, d) => {
          if (!ev.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    )
    .on("click", (_ev, d) => setSelected(d.kind === "memory" ? d : null));

  // Circles
  nodeEl
    .append("circle")
    .attr("r", (d) => d.radius)
    .attr("fill", (d) => COLOR[d.memType] ?? COLOR.hub)
    .attr("fill-opacity", (d) => (d.kind === "hub" ? 1 : 0.82))
    .attr("stroke", (d) =>
      d.kind === "hub" ? "rgba(255,255,255,0.6)" : "none",
    )
    .attr("stroke-width", (d) => (d.kind === "hub" ? 2 : 0))
    .attr("filter", (d) => (d.kind === "hub" ? "url(#glow)" : "none"));

  // Hub labels (always visible)
  nodeEl
    .filter((d) => d.kind === "hub")
    .append("text")
    .text((d) => d.label)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("fill", "#fff")
    .attr("font-size", "10px")
    .attr("font-weight", "700")
    .attr("pointer-events", "none");

  // Memory hover labels
  const hoverLabel = nodeEl
    .filter((d) => d.kind === "memory")
    .append("text")
    .text((d) => d.label)
    .attr("x", 12)
    .attr("y", 4)
    .attr("fill", "#ffffffbb")
    .attr("font-size", "7.5px")
    .attr("pointer-events", "none")
    .attr("opacity", 0);

  nodeEl
    .filter((d) => d.kind === "memory")
    .on("mouseenter", function () {
      d3.select(this)
        .select("circle")
        .attr("fill-opacity", 1)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("r", 12);
      d3.select(this).select("text").attr("opacity", 1);
    })
    .on("mouseleave", function (_, d) {
      d3.select(this)
        .select("circle")
        .attr("fill-opacity", 0.82)
        .attr("stroke", "none")
        .attr("stroke-width", 0)
        .attr("r", d.radius);
      d3.select(this).select("text").attr("opacity", 0);
    });

  void hoverLabel;

  // ── 9. Tick ───────────────────────────────────────────────────────────────
  sim.on("tick", () => {
    linkEl
      .attr("x1", (d) => (d.source as SimNode).x ?? 0)
      .attr("y1", (d) => (d.source as SimNode).y ?? 0)
      .attr("x2", (d) => (d.target as SimNode).x ?? 0)
      .attr("y2", (d) => (d.target as SimNode).y ?? 0);
    nodeEl.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
  });

  // Fit view after simulation settles
  sim.on("end", () => {
    const xs = nodes.map((n) => n.x ?? 0);
    const ys = nodes.map((n) => n.y ?? 0);
    const x0 = Math.min(...xs) - 40,
      x1 = Math.max(...xs) + 40;
    const y0 = Math.min(...ys) - 40,
      y1 = Math.max(...ys) + 40;
    const scale = Math.min(W / (x1 - x0), H / (y1 - y0), 1.4);
    const tx = W / 2 - scale * ((x0 + x1) / 2);
    const ty = H / 2 - scale * ((y0 + y1) / 2);
    const t = d3.zoomIdentity.translate(tx, ty).scale(scale);
    g.transition().duration(700).attr("transform", t.toString());
  });
}
