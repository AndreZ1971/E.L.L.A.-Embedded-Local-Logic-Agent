// Gehirn-Demo — Kraft-Layout Graph mit Beispieldaten
(function () {
  const canvas = document.getElementById("brainCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const slider = document.getElementById("brainSlider");
  const detailEl = document.getElementById("brainDetail");
  const detailType = document.getElementById("brainDetailType");
  const detailText = document.getElementById("brainDetailText");
  const detailDate = document.getElementById("brainDetailDate");

  const W = canvas.width;
  const H = canvas.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.scale(dpr, dpr);

  const TYPE_COLORS = {
    user: "#f59e0b",
    system: "#facc15",
    note: "#22c55e",
    reflection: "#a78bfa",
    knowledge: "#f472b6",
  };

  let nodes = [];
  let edges = [];
  let typeLabels = {};
  let allDates = [];
  let selectedNode = null;
  let hoverNode = null;
  let animFrame = null;

  function getLang() {
    return document.documentElement.getAttribute("data-lang") || "de";
  }

  async function loadData() {
    try {
      const res = await fetch("/data/brain-demo.json");
      const data = await res.json();
      const lang = getLang();
      const langData = data[lang] || data.de;
      typeLabels = langData.typeLabels || {};

      allDates = langData.nodes
        .map((n) => new Date(n.date).getTime())
        .sort((a, b) => a - b);
      const minDate = allDates[0];
      const maxDate = allDates[allDates.length - 1];

      nodes = langData.nodes.map((n, i) => {
        const angle = (i / langData.nodes.length) * Math.PI * 2;
        const r = 80 + Math.random() * 120;
        return {
          ...n,
          x: W / 2 + Math.cos(angle) * r,
          y: H / 2 + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
          r: n.type === "user" ? 8 : n.type === "knowledge" ? 5 : 6,
          dateNorm:
            (new Date(n.date).getTime() - minDate) / (maxDate - minDate || 1),
        };
      });

      edges = langData.edges.map((e) => ({
        ...e,
        source: nodes.find((n) => n.id === e.from),
        target: nodes.find((n) => n.id === e.to),
      }));

      simulate();
    } catch (e) {
      ctx.fillStyle = "#8fb3c9";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Graph data could not be loaded", W / 2, H / 2);
    }
  }

  function simulate() {
    const ITERATIONS = 200;
    const REPULSION = 1200;
    const SPRING = 0.008;
    const SPRING_LEN = 70;
    const DAMPING = 0.85;
    const CENTER_PULL = 0.002;

    for (let iter = 0; iter < ITERATIONS; iter++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      for (const e of edges) {
        if (!e.source || !e.target) continue;
        const dx = e.target.x - e.source.x;
        const dy = e.target.y - e.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - SPRING_LEN) * SPRING;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        e.source.vx += fx;
        e.source.vy += fy;
        e.target.vx -= fx;
        e.target.vy -= fy;
      }

      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * CENTER_PULL;
        n.vy += (H / 2 - n.y) * CENTER_PULL;
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(20, Math.min(W - 20, n.x));
        n.y = Math.max(20, Math.min(H - 20, n.y));
      }
    }

    render();
  }

  function render() {
    const threshold = (slider ? slider.value : 100) / 100;
    const visibleNodes = nodes.filter((n) => n.dateNorm <= threshold);
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = edges.filter(
      (e) =>
        e.source &&
        e.target &&
        visibleIds.has(e.source.id) &&
        visibleIds.has(e.target.id),
    );

    ctx.clearRect(0, 0, W, H);

    // Edges
    for (const e of visibleEdges) {
      ctx.beginPath();
      ctx.moveTo(e.source.x, e.source.y);
      ctx.lineTo(e.target.x, e.target.y);
      ctx.strokeStyle = "rgba(167,139,250,.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const mx = (e.source.x + e.target.x) / 2;
      const my = (e.source.y + e.target.y) / 2;
      ctx.fillStyle = "rgba(167,139,250,.4)";
      ctx.font = "9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(e.label || "", mx, my - 4);
    }

    // Nodes
    for (const n of visibleNodes) {
      const color = TYPE_COLORS[n.type] || "#4fd1ff";
      const isHover = hoverNode === n;
      const isSelected = selectedNode === n;

      if (isHover || isSelected) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 6, 0, Math.PI * 2);
        ctx.fillStyle =
          color.replace(")", ",.15)").replace("rgb", "rgba") ||
          "rgba(79,209,255,.15)";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  function getNodeAt(x, y) {
    const rect = canvas.getBoundingClientRect();
    const sx = (x - rect.left) * (W / rect.width);
    const sy = (y - rect.top) * (H / rect.height);
    const threshold = (slider ? slider.value : 100) / 100;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.dateNorm > threshold) continue;
      const dx = sx - n.x;
      const dy = sy - n.y;
      if (dx * dx + dy * dy <= (n.r + 4) * (n.r + 4)) return n;
    }
    return null;
  }

  canvas.addEventListener("mousemove", (e) => {
    const prev = hoverNode;
    hoverNode = getNodeAt(e.clientX, e.clientY);
    canvas.style.cursor = hoverNode ? "pointer" : "default";
    if (hoverNode !== prev) render();
  });

  canvas.addEventListener("click", (e) => {
    const n = getNodeAt(e.clientX, e.clientY);
    selectedNode = n;
    if (n && detailEl) {
      detailEl.classList.add("visible");
      detailType.textContent = typeLabels[n.type] || n.type;
      detailType.style.color = TYPE_COLORS[n.type] || "#4fd1ff";
      detailText.textContent = n.text;
      detailDate.textContent = n.date;
    } else if (detailEl) {
      detailEl.classList.remove("visible");
    }
    render();
  });

  canvas.addEventListener("touchend", (e) => {
    if (e.changedTouches.length) {
      const t = e.changedTouches[0];
      const n = getNodeAt(t.clientX, t.clientY);
      selectedNode = n;
      if (n && detailEl) {
        detailEl.classList.add("visible");
        detailType.textContent = typeLabels[n.type] || n.type;
        detailType.style.color = TYPE_COLORS[n.type] || "#4fd1ff";
        detailText.textContent = n.text;
        detailDate.textContent = n.date;
      } else if (detailEl) {
        detailEl.classList.remove("visible");
      }
      render();
    }
  });

  if (slider) {
    slider.addEventListener("input", () => render());
  }

  // Re-load when language changes
  const langObs = new MutationObserver(() => {
    loadData();
  });
  langObs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-lang"],
  });

  // Init
  const brainObs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        brainObs.disconnect();
        loadData();
      }
    },
    { threshold: 0.1 },
  );
  brainObs.observe(canvas);
})();
