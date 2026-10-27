// Cinema Scrolling — 219 Frames als Scroll-Sequenz
// Frames werden progressiv geladen: erst 20, dann Rest im Hintergrund
(function () {
  const canvas = document.getElementById("cinemaCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const wrap = document.getElementById("cinema-wrap");
  const TOTAL = 219;
  const isMobile = window.innerWidth <= 768;
  const basePath = isMobile
    ? "/media/frames/mobile/"
    : "/media/frames/desktop/";

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  }
  sizeCanvas();

  const frames = new Array(TOTAL).fill(null);
  let loadedCount = 0;
  let currentFrame = 0;

  function frameSrc(i) {
    const num = String(i + 1).padStart(3, "0");
    return basePath + "frame_" + num + ".webp";
  }

  function loadFrame(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        frames[i] = img;
        loadedCount++;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = frameSrc(i);
    });
  }

  function drawCover(img) {
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(cw / iw, ch / ih);
    const sw = cw / scale;
    const sh = ch / scale;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  function drawFrame(idx) {
    const img = frames[idx];
    if (!img) {
      for (let d = 1; d < TOTAL; d++) {
        if (frames[idx - d]) {
          drawCover(frames[idx - d]);
          return;
        }
        if (frames[idx + d]) {
          drawCover(frames[idx + d]);
          return;
        }
      }
      return;
    }
    drawCover(img);
  }

  function onScroll() {
    const rect = wrap.getBoundingClientRect();
    const scrollable = wrap.scrollHeight - window.innerHeight;
    const progress = Math.max(
      0,
      Math.min(1, -rect.top / Math.max(1, scrollable)),
    );
    const idx = Math.min(TOTAL - 1, Math.floor(progress * TOTAL));
    if (idx !== currentFrame) {
      currentFrame = idx;
      drawFrame(idx);
    }
  }

  async function init() {
    const first20 = [];
    for (let i = 0; i < Math.min(20, TOTAL); i++) first20.push(loadFrame(i));
    await Promise.all(first20);
    drawFrame(0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      sizeCanvas();
      drawFrame(currentFrame);
    });
    onScroll();

    const BATCH = 6;
    for (let i = 20; i < TOTAL; i += BATCH) {
      const batch = [];
      for (let j = i; j < Math.min(i + BATCH, TOTAL); j++) {
        if (!frames[j]) batch.push(loadFrame(j));
      }
      await Promise.all(batch);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
