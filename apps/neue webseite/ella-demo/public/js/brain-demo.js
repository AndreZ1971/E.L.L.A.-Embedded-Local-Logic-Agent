// Gehirn-Demo — d3 Force-Layout, Verhalten wie MemoryGraph.tsx
// Referenz: apps/web/src/pages/memories/MemoryGraph.tsx
(function () {
  "use strict";

  const section = document.getElementById("brain");
  if (!section) return;
  const svgEl = document.getElementById("brainGraph");
  if (!svgEl) return;

  const COLOR = {
    user: "#f97316",
    system: "#f59e0b",
    note: "#10b981",
    reflection: "#a78bfa",
    hub: "#8b5cf6",
  };
  const START = new Date(2026, 9, 1, 19, 0);
  const TOTAL_DAYS = 28;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ── State ──────────────────────────────────────────────────────────────────
  let data = null;
  let labels = {};
  let MEMS = [];
  let SEM = [];
  let KNOWLEDGE = [];
  let sim = null;
  let currentDay = TOTAL_DAYS;
  let filterType = "all";
  let playing = false;
  let playTimer = null;
  let graphActive = false;
  let showList = false;

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const chipsEl = document.getElementById("brainChips");
  const panelEl = document.getElementById("brainPanel");
  const panelBadge = document.getElementById("brainPBadge");
  const panelSrc = document.getElementById("brainPSrc");
  const panelText = document.getElementById("brainPText");
  const panelDate = document.getElementById("brainPDate");
  const panelClose = document.getElementById("brainPClose");
  const slider = document.getElementById("brainDay");
  const dayLabel = document.getElementById("brainDayLabel");
  const playBtn = document.getElementById("brainPlay");
  const listEl = document.getElementById("brainListBody");
  const toggleGraphBtn = document.getElementById("brainToggleGraph");
  const toggleListBtn = document.getElementById("brainToggleList");
  const stageEl = document.getElementById("brainStage");
  const listWrap = document.getElementById("brainListWrap");

  // ── Hash for stable pseudo-random (no Math.random) ─────────────────────
  function rnd(i) {
    var x = Math.sin(i * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }

  // ── Language ───────────────────────────────────────────────────────────────
  function getLang() {
    return document.documentElement.getAttribute("data-lang") || "de";
  }

  // ── Load data ──────────────────────────────────────────────────────────────
  async function loadData() {
    var lang = getLang();
    var url = "/data/brain-demo." + lang + ".json";
    var res = await fetch(url);
    data = await res.json();
    labels = data.labels || {};

    // Build MEMS from data.memories
    MEMS = data.memories.map(function (r, i) {
      var d = new Date(START);
      d.setDate(d.getDate() + r.day - 1);
      d.setMinutes(Math.floor(rnd(i) * 240));
      return {
        uid: "mem_" + i,
        kind: "memory",
        day: r.day,
        memType: r.type,
        topic: r.topic,
        content: r.text,
        label: r.text.slice(0, 32) + (r.text.length > 32 ? "…" : ""),
        radius: 9,
        source: "session:" + String(1000 + r.day),
        created_at: d,
      };
    });

    // Semantic edges: same topic connects 2-3 neighbors
    SEM = [];
    var byTopic = d3.group(MEMS, function (m) {
      return m.topic;
    });
    for (var list of byTopic.values()) {
      list.forEach(function (m, i) {
        for (var k = 1; k <= 3; k++) {
          var o = list[i + k];
          if (!o) break;
          if (k === 3 && rnd(i * 7 + k) > 0.5) continue;
          SEM.push({
            a: m.uid,
            b: o.uid,
            weight: 0.55 + rnd(i * 13 + k) * 0.4,
          });
        }
      });
    }
    // Extra cross-topic semantic edges
    (data.semanticExtra || []).forEach(function (e, i) {
      SEM.push({
        a: "mem_" + e.a,
        b: "mem_" + e.b,
        weight: 0.5 + rnd(i + 77) * 0.2,
      });
    });

    // Knowledge edges
    KNOWLEDGE = (data.knowledge || []).map(function (k) {
      return [k.a, k.b, k.label];
    });

    // Update texts
    var titleEl = document.getElementById("brainTitle");
    var subtitleEl = document.getElementById("brainSubtitle");
    var footerEl = document.getElementById("brainFooter");
    var hintEl = document.getElementById("brainHint");
    var badgeLocal = document.getElementById("brainBadgeLocal");
    var badgeSample = document.getElementById("brainBadgeSample");
    if (titleEl) titleEl.textContent = labels.title || "";
    if (subtitleEl) subtitleEl.textContent = labels.subtitle || "";
    if (footerEl) footerEl.textContent = labels.footer || "";
    if (hintEl) hintEl.textContent = labels.hint || "";
    if (badgeLocal) badgeLocal.textContent = "● " + (labels.local || "");
    if (badgeSample) badgeSample.textContent = labels.sample || "";
    if (playBtn) playBtn.textContent = labels.play || "▶ Play";
    if (toggleGraphBtn)
      toggleGraphBtn.textContent = labels.graphView || "Graph";
    if (toggleListBtn) toggleListBtn.textContent = labels.listView || "Liste";
  }

  // ── SVG setup ──────────────────────────────────────────────────────────────
  var svg, g, gLinks, gLabels, gNodes, zoom;
  var W, H;
  var linkSel, labelSel, nodeSel;
  var HUBS;

  function setupSVG() {
    svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    W = svgEl.clientWidth || 900;
    H = svgEl.clientHeight || 560;

    // Glow filter
    var defs = svg.append("defs");
    var f = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    f.append("feGaussianBlur").attr("stdDeviation", "5").attr("result", "blur");
    var fm = f.append("feMerge");
    fm.append("feMergeNode").attr("in", "blur");
    fm.append("feMergeNode").attr("in", "SourceGraphic");

    g = svg.append("g");
    gLinks = g.append("g");
    gLabels = g.append("g");
    gNodes = g.append("g");

    // Zoom — Ctrl+wheel on desktop, two-finger on touch
    zoom = d3
      .zoom()
      .scaleExtent([0.15, 5])
      .filter(function (ev) {
        if (ev.type === "wheel") return ev.ctrlKey;
        if (ev.type === "touchstart" || ev.type === "touchmove")
          return ev.touches && ev.touches.length >= 2;
        return true;
      })
      .on("zoom", function (ev) {
        g.attr("transform", ev.transform);
      });
    svg.call(zoom);

    // Click on empty area hides panel
    svg.on("click", hidePanel);

    // Hub nodes
    var hubLabels = {
      user: labels.hubUser || "Nutzer",
      system: labels.hubSystem || "System",
      note: labels.hubNote || "Notiz",
      reflection: labels.hubReflection || "Reflexion",
    };
    HUBS = ["user", "system", "note", "reflection"].map(function (t, i) {
      return {
        uid: "hub_" + t,
        kind: "hub",
        memType: t,
        label: hubLabels[t],
        radius: 26,
        x: W / 2 + Math.cos((i * Math.PI) / 2) * 120,
        y: H / 2 + Math.sin((i * Math.PI) / 2) * 120,
      };
    });

    linkSel = gLinks.selectAll("line");
    labelSel = gLabels.selectAll("text");
    nodeSel = gNodes.selectAll("g");
  }

  // ── Build graph (like Muster) ──────────────────────────────────────────────
  function build() {
    var vis = MEMS.filter(function (m) {
      return (
        m.day <= currentDay &&
        (filterType === "all" || m.memType === filterType)
      );
    });
    var visIds = new Set(
      vis.map(function (m) {
        return m.uid;
      }),
    );
    var present = new Set(
      vis.map(function (m) {
        return m.memType;
      }),
    );
    HUBS.forEach(function (h) {
      h.radius = present.has(h.memType) ? 26 : 18;
    });

    // New nodes spawn near their hub
    vis.forEach(function (m) {
      if (m.x === undefined) {
        var h = HUBS.find(function (hub) {
          return hub.memType === m.memType;
        });
        m.x = (h ? h.x : W / 2) + (rnd(+m.uid.slice(4)) - 0.5) * 30;
        m.y = (h ? h.y : H / 2) + (rnd(+m.uid.slice(4) + 3) - 0.5) * 30;
      }
    });

    var nodes = [].concat(HUBS, vis);
    var links = [];

    // Memory → hub
    vis.forEach(function (m) {
      links.push({
        source: m.uid,
        target: "hub_" + m.memType,
        linkType: "hub",
        weight: 1,
      });
    });

    // Hub ↔ hub
    for (var i = 0; i < HUBS.length - 1; i++) {
      links.push({
        source: HUBS[i].uid,
        target: HUBS[i + 1].uid,
        linkType: "hub",
        weight: 0.1,
      });
    }

    // Semantic edges
    SEM.forEach(function (e) {
      if (visIds.has(e.a) && visIds.has(e.b)) {
        links.push({
          source: e.a,
          target: e.b,
          linkType: "semantic",
          weight: e.weight,
        });
      }
    });

    // Knowledge edges
    KNOWLEDGE.forEach(function (k) {
      var A = "mem_" + k[0],
        B = "mem_" + k[1];
      if (visIds.has(A) && visIds.has(B)) {
        links.push({
          source: A,
          target: B,
          linkType: "knowledge",
          weight: 0.8,
          label: k[2],
        });
      }
    });

    // Session edges
    var bySession = d3.group(vis, function (m) {
      return m.source;
    });
    for (var grp of bySession.values()) {
      for (var j = 0; j < grp.length - 1; j++) {
        links.push({
          source: grp[j].uid,
          target: grp[j + 1].uid,
          linkType: "session",
          weight: 0.4,
        });
      }
    }

    // ── Render links ─────────────────────────────────────────────────────────
    var key = function (d) {
      return (
        (typeof d.source === "object" ? d.source.uid : d.source) +
        "|" +
        (typeof d.target === "object" ? d.target.uid : d.target) +
        "|" +
        d.linkType
      );
    };
    linkSel = gLinks
      .selectAll("line")
      .data(links, key)
      .join(
        function (enter) {
          return enter
            .append("line")
            .attr("stroke-opacity", 0)
            .call(function (s) {
              s.transition()
                .duration(reduceMotion ? 0 : 500)
                .attr("stroke-opacity", 1);
            });
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit.remove();
        },
      )
      .attr("stroke", function (d) {
        if (d.linkType === "hub") return "#ffffff18";
        if (d.linkType === "session") return "#ffffff30";
        if (d.linkType === "knowledge") return "#a78bfa90";
        return "#ffffff40";
      })
      .attr("stroke-width", function (d) {
        if (d.linkType === "hub") return 0.8;
        if (d.linkType === "session") return 1;
        if (d.linkType === "knowledge") return 1.5;
        return 0.6 + d.weight * 1.4;
      })
      .attr("stroke-dasharray", function (d) {
        return d.linkType === "knowledge" ? "6 3" : null;
      });

    // Knowledge labels
    labelSel = gLabels
      .selectAll("text")
      .data(
        links.filter(function (l) {
          return l.linkType === "knowledge";
        }),
        key,
      )
      .join("text")
      .text(function (d) {
        return d.label || "";
      })
      .attr("fill", "#a78bfacc")
      .attr("font-size", "6.5px")
      .attr("text-anchor", "middle")
      .attr("pointer-events", "none")
      .attr("opacity", 0.7)
      .attr("font-family", "JetBrains Mono, monospace");

    // ── Render nodes ─────────────────────────────────────────────────────────
    nodeSel = gNodes
      .selectAll("g.n")
      .data(nodes, function (d) {
        return d.uid;
      })
      .join(
        function (enter) {
          var ng = enter
            .append("g")
            .attr("class", "n")
            .attr("cursor", "pointer");
          ng.append("circle");
          // Hub labels
          ng.filter(function (d) {
            return d.kind === "hub";
          })
            .append("text")
            .attr("class", "hl")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("fill", "#fff")
            .attr("font-size", "10px")
            .attr("font-weight", "700")
            .attr("pointer-events", "none")
            .attr("font-family", "Chakra Petch, sans-serif");
          // Memory hover labels
          ng.filter(function (d) {
            return d.kind === "memory";
          })
            .append("text")
            .attr("class", "ml")
            .text(function (d) {
              return d.label;
            })
            .attr("x", 13)
            .attr("y", 4)
            .attr("fill", "#ffffffbb")
            .attr("font-size", "7.5px")
            .attr("pointer-events", "none")
            .attr("opacity", 0)
            .attr("font-family", "JetBrains Mono, monospace");
          // Animate memory circles in
          ng.filter(function (d) {
            return d.kind === "memory";
          })
            .select("circle")
            .attr("r", 0)
            .transition()
            .duration(reduceMotion ? 0 : 450)
            .attr("r", function (d) {
              return d.radius;
            });
          // Drag
          ng.call(
            d3
              .drag()
              .on("start", function (ev, d) {
                if (!ev.active) sim.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
              })
              .on("drag", function (ev, d) {
                d.fx = ev.x;
                d.fy = ev.y;
              })
              .on("end", function (ev, d) {
                if (!ev.active) sim.alphaTarget(0);
                d.fx = null;
                d.fy = null;
              }),
          );
          // Click
          ng.on("click", function (ev, d) {
            ev.stopPropagation();
            if (d.kind === "memory") showPanel(d);
          });
          // Hover
          ng.filter(function (d) {
            return d.kind === "memory";
          })
            .on("mouseenter", function (_, d) {
              d3.select(this)
                .select("circle")
                .attr("fill-opacity", 1)
                .attr("stroke", "#fff")
                .attr("stroke-width", 2)
                .attr("r", d.radius + 3);
              d3.select(this).select(".ml").attr("opacity", 1);
            })
            .on("mouseleave", function (_, d) {
              d3.select(this)
                .select("circle")
                .attr("fill-opacity", 0.82)
                .attr("stroke", "none")
                .attr("stroke-width", 0)
                .attr("r", d.radius);
              d3.select(this).select(".ml").attr("opacity", 0);
            });
          return ng;
        },
        function (update) {
          return update;
        },
        function (exit) {
          return exit
            .transition()
            .duration(reduceMotion ? 0 : 250)
            .style("opacity", 0)
            .remove();
        },
      );

    // Style circles
    nodeSel
      .select("circle")
      .attr("fill", function (d) {
        return COLOR[d.memType] || COLOR.hub;
      })
      .attr("fill-opacity", function (d) {
        if (d.kind !== "hub") return 0.82;
        return present.has(d.memType) ? 1 : 0.3;
      })
      .attr("stroke", function (d) {
        return d.kind === "hub" ? "rgba(255,255,255,0.6)" : "none";
      })
      .attr("stroke-width", function (d) {
        return d.kind === "hub" ? 2 : 0;
      })
      .attr("stroke-opacity", function (d) {
        return d.kind === "hub" && !present.has(d.memType) ? 0.3 : 1;
      })
      .attr("filter", function (d) {
        return d.kind === "hub" && present.has(d.memType) ? "url(#glow)" : null;
      })
      .filter(function (d) {
        return d.kind === "hub";
      })
      .attr("r", function (d) {
        return d.radius;
      });
    nodeSel.select(".hl").text(function (d) {
      return present.has(d.memType) ? d.label : "";
    });

    // ── Simulation ───────────────────────────────────────────────────────────
    if (sim) sim.stop();
    sim = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id(function (d) {
            return d.uid;
          })
          .strength(function (d) {
            if (d.linkType === "hub") return 0.7;
            if (d.linkType === "session") return 0.5;
            if (d.linkType === "knowledge") return 0.4;
            return 0.15 + (d.weight - 0.45) * 0.5;
          })
          .distance(function (d) {
            if (d.linkType === "hub") {
              return d.source.kind === "hub" ? 140 : 70;
            }
            if (d.linkType === "semantic") return 60 + (1 - d.weight) * 80;
            if (d.linkType === "knowledge") return 55;
            return 50;
          }),
      )
      .force(
        "charge",
        d3.forceManyBody().strength(function (d) {
          return d.kind === "hub" ? -350 : -45;
        }),
      )
      .force("center", d3.forceCenter(W / 2, H / 2).strength(0.05))
      .force(
        "collision",
        d3
          .forceCollide()
          .radius(function (d) {
            return d.radius + 5;
          })
          .strength(0.9),
      )
      .alphaDecay(reduceMotion ? 0.08 : 0.0228)
      .on("tick", ticked)
      .on("end", fitView);

    sim.alpha(Math.max(sim.alpha(), 0.5)).restart();

    // Update chips
    var pool = MEMS.filter(function (m) {
      return m.day <= currentDay;
    });
    var counts = {
      all: pool.length,
      user: 0,
      system: 0,
      note: 0,
      reflection: 0,
    };
    pool.forEach(function (m) {
      counts[m.memType]++;
    });
    renderChips(counts);

    // Update day label
    if (dayLabel) {
      dayLabel.innerHTML =
        (labels.day || "Tag") +
        " <b>" +
        currentDay +
        "</b> · " +
        pool.length +
        " " +
        (labels.memories || "Erinnerungen");
    }

    // Update list view
    renderList(vis);
  }

  function ticked() {
    linkSel
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });
    labelSel
      .attr("x", function (d) {
        return (d.source.x + d.target.x) / 2;
      })
      .attr("y", function (d) {
        return (d.source.y + d.target.y) / 2 - 4;
      });
    nodeSel.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }

  function fitView() {
    var ns = sim ? sim.nodes() : [];
    if (!ns.length) return;
    var xs = ns.map(function (n) {
      return n.x;
    });
    var ys = ns.map(function (n) {
      return n.y;
    });
    var x0 = Math.min.apply(null, xs) - 40;
    var x1 = Math.max.apply(null, xs) + 40;
    var y0 = Math.min.apply(null, ys) - 40;
    var y1 = Math.max.apply(null, ys) + 40;
    var s = Math.min(W / (x1 - x0), H / (y1 - y0), 1.4);
    var t = d3.zoomIdentity
      .translate(W / 2 - (s * (x0 + x1)) / 2, H / 2 - (s * (y0 + y1)) / 2)
      .scale(s);
    svg
      .transition()
      .duration(reduceMotion ? 0 : 700)
      .call(zoom.transform, t);
  }

  // ── Chips ──────────────────────────────────────────────────────────────────
  function renderChips(c) {
    if (!chipsEl) return;
    var types = [
      ["all", labels.filterAll || "Alle"],
      ["user", labels.filterUser || "Nutzer"],
      ["system", labels.filterSystem || "System"],
      ["note", labels.filterNote || "Notizen"],
      ["reflection", labels.filterReflection || "Reflexionen"],
    ];
    chipsEl.innerHTML = types
      .map(function (t) {
        return (
          '<button class="bd-chip ' +
          (t[0] === filterType ? "on" : "") +
          '" data-t="' +
          t[0] +
          '" aria-pressed="' +
          (t[0] === filterType) +
          '">' +
          t[1] +
          "<b>" +
          (c[t[0]] || 0) +
          "</b></button>"
        );
      })
      .join("");
    chipsEl.querySelectorAll(".bd-chip").forEach(function (b) {
      b.onclick = function () {
        filterType = b.dataset.t;
        hidePanel();
        build();
      };
    });
  }

  // ── Panel ──────────────────────────────────────────────────────────────────
  function showPanel(d) {
    if (!panelEl) return;
    var hubNames = {
      user: labels.hubUser || "Nutzer",
      system: labels.hubSystem || "System",
      note: labels.hubNote || "Notiz",
      reflection: labels.hubReflection || "Reflexion",
    };
    panelBadge.textContent = hubNames[d.memType] || d.memType;
    panelBadge.style.background = COLOR[d.memType];
    panelSrc.textContent = d.source || "";
    panelText.textContent = d.content;
    panelDate.textContent = d.created_at.toLocaleString(
      getLang() === "de" ? "de-DE" : "en-US",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
    panelEl.hidden = false;
  }

  function hidePanel() {
    if (panelEl) panelEl.hidden = true;
  }

  if (panelClose) panelClose.onclick = hidePanel;

  // ── Timeline ───────────────────────────────────────────────────────────────
  if (slider) {
    slider.addEventListener("input", function () {
      stopPlay();
      currentDay = +slider.value;
      build();
    });
  }

  function stopPlay() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    playing = false;
    if (playBtn) playBtn.textContent = labels.play || "▶ Abspielen";
  }

  function startPlay() {
    hidePanel();
    currentDay = 1;
    if (slider) slider.value = 1;
    build();
    playing = true;
    if (playBtn) playBtn.textContent = labels.pause || "❚❚ Pause";
    playTimer = setInterval(
      function () {
        if (currentDay >= TOTAL_DAYS) return stopPlay();
        currentDay++;
        if (slider) slider.value = currentDay;
        build();
      },
      reduceMotion ? 300 : 650,
    );
  }

  if (playBtn) {
    playBtn.onclick = function () {
      if (playing) return stopPlay();
      startPlay();
    };
  }

  // ── List view ──────────────────────────────────────────────────────────────
  function renderList(vis) {
    if (!listEl) return;
    if (!vis || vis.length === 0) {
      listEl.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:var(--ella-muted)">—</td></tr>';
      return;
    }
    var hubNames = {
      user: labels.hubUser || "Nutzer",
      system: labels.hubSystem || "System",
      note: labels.hubNote || "Notiz",
      reflection: labels.hubReflection || "Reflexion",
    };
    listEl.innerHTML = vis
      .map(function (m) {
        return (
          "<tr>" +
          '<td><span class="bd-list-dot" style="background:' +
          COLOR[m.memType] +
          '"></span>' +
          (hubNames[m.memType] || m.memType) +
          "</td>" +
          "<td>" +
          m.content +
          "</td>" +
          "<td>" +
          (labels.session || "Sitzung") +
          " " +
          m.day +
          "</td>" +
          "<td>" +
          m.created_at.toLocaleDateString(
            getLang() === "de" ? "de-DE" : "en-US",
          ) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  // Graph/List toggle
  function setView(mode) {
    showList = mode === "list";
    if (stageEl) stageEl.style.display = showList ? "none" : "block";
    if (listWrap) listWrap.style.display = showList ? "block" : "none";
    if (toggleGraphBtn) {
      toggleGraphBtn.classList.toggle("on", !showList);
      toggleGraphBtn.setAttribute("aria-pressed", String(!showList));
    }
    if (toggleListBtn) {
      toggleListBtn.classList.toggle("on", showList);
      toggleListBtn.setAttribute("aria-pressed", String(showList));
    }
  }

  if (toggleGraphBtn) {
    toggleGraphBtn.onclick = function () {
      setView("graph");
    };
  }
  if (toggleListBtn) {
    toggleListBtn.onclick = function () {
      setView("list");
    };
  }

  // ── Resize ─────────────────────────────────────────────────────────────────
  new ResizeObserver(function () {
    var nw = svgEl.clientWidth,
      nh = svgEl.clientHeight;
    if (!nw || !nh || (nw === W && nh === H)) return;
    W = nw;
    H = nh;
    if (sim) {
      sim.force("center", d3.forceCenter(W / 2, H / 2).strength(0.05));
      sim.alpha(0.3).restart();
    }
  }).observe(svgEl);

  // ── Visibility: pause sim when hidden ──────────────────────────────────────
  var visObs = new IntersectionObserver(
    function (entries) {
      var visible = entries[0].isIntersecting;
      if (!sim) return;
      if (visible && !graphActive) {
        graphActive = true;
        sim.alpha(0.3).restart();
      } else if (!visible && graphActive) {
        graphActive = false;
        sim.stop();
      }
    },
    { threshold: 0.1 },
  );
  visObs.observe(section);

  // ── Init: lazy load when section approaches viewport ───────────────────────
  var initDone = false;
  var autoPlayed = false;
  var initObs = new IntersectionObserver(
    function (entries) {
      if (!entries[0].isIntersecting) return;
      if (initDone) {
        // Auto-play on 40% visibility
        if (!autoPlayed && entries[0].intersectionRatio >= 0.4) {
          autoPlayed = true;
          if (!reduceMotion) startPlay();
        }
        return;
      }
      initDone = true;
      initObs.disconnect();
      // Start the init observer for auto-play
      loadData().then(function () {
        setupSVG();
        build();
        setView("graph");
        // Re-observe for auto-play at 40%
        autoObs.observe(section);
      });
    },
    { rootMargin: "600px", threshold: [0, 0.4] },
  );
  initObs.observe(section);

  var autoObs = new IntersectionObserver(
    function (entries) {
      if (
        entries[0].isIntersecting &&
        entries[0].intersectionRatio >= 0.4 &&
        !autoPlayed
      ) {
        autoPlayed = true;
        autoObs.disconnect();
        if (!reduceMotion) startPlay();
      }
    },
    { threshold: 0.4 },
  );

  // ── Language switch ────────────────────────────────────────────────────────
  new MutationObserver(function () {
    if (!initDone) return;
    stopPlay();
    // Reset positions so graph rebuilds cleanly
    MEMS.forEach(function (m) {
      delete m.x;
      delete m.y;
      delete m.vx;
      delete m.vy;
    });
    loadData().then(function () {
      setupSVG();
      currentDay = TOTAL_DAYS;
      if (slider) slider.value = TOTAL_DAYS;
      build();
    });
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-lang"],
  });
})();
