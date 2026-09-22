import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface Memory {
  id: number;
  type: string;
  content: string;
  source: string | null;
  created_at: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: "hub" | "memory";
  memType: string;
  content?: string;
  source?: string | null;
  created_at?: string;
  memId?: number;
  radius: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  strength: number;
}

const TYPE_COLOR: Record<string, string> = {
  hub_user: "#8b5cf6",
  hub_system: "#8b5cf6",
  hub_note: "#8b5cf6",
  hub_reflection: "#8b5cf6",
  user: "#f97316",
  system: "#f59e0b",
  note: "#10b981",
  reflection: "#a78bfa",
};

const TYPE_DE: Record<string, string> = {
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
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/memories?limit=200&offset=0");
        if (!res.ok) throw new Error("Fehler beim Laden");
        const data = (await res.json()) as { memories: Memory[] };
        if (cancelled) return;
        renderGraph(data.memories);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function renderGraph(memories: Memory[]) {
    if (!svgRef.current) return;

    const el = svgRef.current;
    const W = el.clientWidth || 900;
    const H = el.clientHeight || 600;

    d3.select(el).selectAll("*").remove();

    // --- Build nodes & links ---
    const hubs: GraphNode[] = ["user", "system", "note", "reflection"].map(
      (t) => ({
        id: `hub_${t}`,
        label:
          lang === "de" ? TYPE_DE[t] : t.charAt(0).toUpperCase() + t.slice(1),
        group: "hub",
        memType: t,
        radius: 28,
      }),
    );

    const memNodes: GraphNode[] = memories.map((m) => {
      const effectiveType = m.source === "reflection" ? "reflection" : m.type;
      return {
        id: `mem_${m.id}`,
        label: m.content.slice(0, 28) + (m.content.length > 28 ? "…" : ""),
        group: "memory",
        memType: effectiveType,
        content: m.content,
        source: m.source,
        created_at: m.created_at,
        memId: m.id,
        radius: 10,
      };
    });

    const nodes: GraphNode[] = [...hubs, ...memNodes];

    // Each memory → its hub
    const links: GraphLink[] = memNodes.map((n) => ({
      source: n.id,
      target: `hub_${n.memType}`,
      strength: 0.6,
    }));

    // Connect memories from the same session source
    const bySource: Record<string, GraphNode[]> = {};
    for (const n of memNodes) {
      if (n.source && n.source.startsWith("session:")) {
        const k = n.source;
        if (!bySource[k]) bySource[k] = [];
        bySource[k].push(n);
      }
    }
    for (const group of Object.values(bySource)) {
      for (let i = 0; i < group.length - 1; i++) {
        links.push({
          source: group[i].id,
          target: group[i + 1].id,
          strength: 0.2,
        });
      }
    }

    // --- SVG setup ---
    const svg = d3.select(el).attr("width", W).attr("height", H);

    const defs = svg.append("defs");
    // Glow filter
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g");

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(zoom);

    // Force simulation
    const sim = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .strength((d) => d.strength)
          .distance((d) => {
            const src = d.source as GraphNode;
            return src.group === "hub" ? 80 : 120;
          }),
      )
      .force(
        "charge",
        d3
          .forceManyBody<GraphNode>()
          .strength((d) => (d.group === "hub" ? -400 : -60)),
      )
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force(
        "collision",
        d3.forceCollide<GraphNode>().radius((d) => d.radius + 4),
      );

    // Links
    const link = g
      .append("g")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", "#ffffff22")
      .attr("stroke-width", (d) => (d.strength > 0.3 ? 1.5 : 0.8));

    // Node groups
    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      )
      .on("click", (_event, d) => setSelected(d));

    // Circles
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) =>
        d.group === "hub"
          ? (TYPE_COLOR[`hub_${d.memType}`] ?? "#8b5cf6")
          : (TYPE_COLOR[d.memType] ?? "#f97316"),
      )
      .attr("fill-opacity", (d) => (d.group === "hub" ? 0.95 : 0.85))
      .attr("stroke", (d) => (d.group === "hub" ? "#fff" : "none"))
      .attr("stroke-width", (d) => (d.group === "hub" ? 2 : 0))
      .attr("filter", (d) => (d.group === "hub" ? "url(#glow)" : "none"));

    // Hub labels
    node
      .filter((d) => d.group === "hub")
      .append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#fff")
      .attr("font-size", "11px")
      .attr("font-weight", "700")
      .attr("pointer-events", "none");

    // Memory hover labels
    const tooltip = node
      .filter((d) => d.group === "memory")
      .append("text")
      .text((d) => d.label)
      .attr("x", 13)
      .attr("y", 4)
      .attr("fill", "#ffffff99")
      .attr("font-size", "8px")
      .attr("pointer-events", "none")
      .attr("opacity", 0);

    node
      .filter((d) => d.group === "memory")
      .on("mouseenter", function () {
        d3.select(this)
          .select("circle")
          .attr("fill-opacity", 1)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5);
        d3.select(this).select("text").attr("opacity", 1);
      })
      .on("mouseleave", function () {
        d3.select(this)
          .select("circle")
          .attr("fill-opacity", 0.85)
          .attr("stroke", "none")
          .attr("stroke-width", 0);
        d3.select(this).select("text").attr("opacity", 0);
      });

    void tooltip; // used via mouseenter

    // Tick
    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });
  }

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

  return (
    <div className="graph-container">
      {loading && (
        <div className="graph-loading">
          {lang === "de" ? "Lade Graph…" : "Loading graph…"}
        </div>
      )}
      {error && <div className="graph-error">{error}</div>}

      <svg ref={svgRef} className="graph-svg" />

      {/* Legend */}
      <div className="graph-legend">
        {["user", "system", "note", "reflection"].map((t) => (
          <span key={t} className="legend-item">
            <span
              className="legend-dot"
              style={{ background: TYPE_COLOR[t] }}
            />
            {lang === "de"
              ? TYPE_DE[t]
              : t.charAt(0).toUpperCase() + t.slice(1)}
          </span>
        ))}
      </div>

      {/* Info panel */}
      {selected && selected.group === "memory" && (
        <div className="graph-panel">
          <button className="panel-close" onClick={() => setSelected(null)}>
            ✕
          </button>
          <div
            className="panel-badge"
            style={{ background: TYPE_COLOR[selected.memType] }}
          >
            {lang === "de" ? TYPE_DE[selected.memType] : selected.memType}
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
