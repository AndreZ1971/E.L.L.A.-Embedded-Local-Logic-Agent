// ── Trusted Types policy ────────────────────────────────────────────────────
const __html =
  typeof trustedTypes !== "undefined" && trustedTypes.createPolicy
    ? trustedTypes.createPolicy("ella-html", { createHTML: (s) => s })
    : { createHTML: (s) => s };

// ── Challenge page (IIFE) ────────────────────────────────────────────────────
(function () {
  const LANG = localStorage.getItem("ella-lang") || "en";
  let dcHistory = [];
  let dcDenied = 0;
  let dcTotal = 0;
  let dcCounts = { harm: 0, exfiltrate: 0, unregistered: 0 };
  const dcSeenIds = new Set();

  // ── SSE audit stream ──────────────────────────────────────
  let evtSource;
  function connectStream() {
    if (evtSource) evtSource.close();
    evtSource = new EventSource("/api/challenge/audit-stream");
    evtSource.onmessage = (e) => {
      const entry = JSON.parse(e.data);
      if (entry._id && dcSeenIds.has(entry._id)) return;
      if (entry._id) dcSeenIds.add(entry._id);
      appendAuditRow(entry);
      dcTotal++;
      if (entry.decision === "deny") {
        dcDenied++;
        if (entry.prohibition && dcCounts[entry.prohibition] !== undefined) {
          dcCounts[entry.prohibition]++;
        }
      }
      updateCounts();
    };
    evtSource.onerror = () => {
      document.getElementById("dc-live-label").textContent = "Reconnecting...";
      setTimeout(connectStream, 3000);
    };
    evtSource.onopen = () => {
      document.getElementById("dc-live-label").textContent =
        LANG === "de" ? "Live-Stream verbunden" : "Live stream connected";
    };
  }
  connectStream();

  function updateCounts() {
    document.getElementById("dc-total").textContent = dcTotal;
    document.getElementById("dc-harm-count").textContent =
      dcCounts.harm + (LANG === "de" ? " blockiert" : " blocked");
    document.getElementById("dc-exfil-count").textContent =
      dcCounts.exfiltrate + (LANG === "de" ? " blockiert" : " blocked");
    document.getElementById("dc-unreg-count").textContent =
      dcCounts.unregistered + (LANG === "de" ? " blockiert" : " blocked");
    document.getElementById("dc-ella-sub").textContent =
      "llama3.1:8b · Directive v1.0.0 · " +
      dcDenied +
      (LANG === "de" ? " abgelehnt" : " denied");
    document.getElementById("dc-log-count").textContent =
      dcTotal + (LANG === "de" ? " Entscheidungen" : " decisions");
  }

  function appendAuditRow(entry) {
    const tbody = document.getElementById("dc-log-body");
    const empty = document.getElementById("dc-empty-log");
    if (empty) empty.remove();
    const tr = document.createElement("tr");
    const t = new Date(entry.timestamp).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const decisionHtml =
      entry.decision === "deny"
        ? '<span class="log-tag-deny">✗ DENY</span>'
        : '<span class="log-tag-allow">✓ ALLOW</span>';
    tr.innerHTML = __html.createHTML(
      `<td>${decisionHtml}</td><td style="font-family:var(--mono);font-size:0.8rem;">${entry.tool}</td><td style="font-size:0.8rem;color:var(--muted);">${entry.prohibition || "—"}</td><td style="font-size:0.8rem;color:var(--muted);">${t}</td>`,
    );
    tbody.insertBefore(tr, tbody.firstChild);
    document.getElementById("dc-log-count").textContent =
      dcTotal + 1 + (LANG === "de" ? " Entscheidungen" : " decisions");
  }

  // ── Send attempt ──────────────────────────────────────────
  window.dcSend = async function () {
    const prompt = document.getElementById("dc-prompt").value.trim();
    const nickname =
      document.getElementById("dc-nickname").value.trim() || "Anonymous";
    if (!prompt) return;

    const btn = document.getElementById("dc-send");
    const area = document.getElementById("dc-response");
    btn.disabled = true;
    btn.textContent = "...";

    // Add user message
    const userMsg = document.createElement("div");
    userMsg.className = "dc-msg dc-msg-user";
    userMsg.textContent = prompt;
    area.appendChild(userMsg);

    // Thinking indicator
    const thinkingMsg = document.createElement("div");
    thinkingMsg.className = "dc-msg dc-msg-system";
    thinkingMsg.id = "dc-thinking";
    thinkingMsg.textContent =
      LANG === "de" ? "E.L.L.A. denkt nach..." : "E.L.L.A. is thinking...";
    area.appendChild(thinkingMsg);
    area.scrollTop = area.scrollHeight;
    document.getElementById("dc-prompt").value = "";

    try {
      const res = await fetch("/api/challenge/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          nickname,
          history: dcHistory,
        }),
      });
      const data = await res.json();
      document.getElementById("dc-thinking")?.remove();

      dcHistory.push({ role: "user", content: prompt });

      if (data.directive_blocked) {
        // Show blocked message
        const blockedMsg = document.createElement("div");
        blockedMsg.className = "dc-msg dc-msg-blocked";
        const toolTags = data.denied_tools
          .map((t) => `<span class="dc-tool-tag dc-tool-deny">✗ ${t}</span>`)
          .join(" ");
        blockedMsg.innerHTML = __html.createHTML(
          `<strong style="color:var(--danger);">${LANG === "de" ? "Directive hat blockiert" : "Directive blocked"}</strong><br>${toolTags}`,
        );
        area.appendChild(blockedMsg);
        dcHistory.push({
          role: "assistant",
          content: "[DIRECTIVE BLOCKED: " + data.denied_tools.join(", ") + "]",
        });
      } else if (data.response) {
        const ellaMsg = document.createElement("div");
        ellaMsg.className = "dc-msg dc-msg-ella";
        ellaMsg.textContent = data.response;
        area.appendChild(ellaMsg);
        dcHistory.push({ role: "assistant", content: data.response });

        if (data.allowed_tools?.length > 0) {
          const allowedMsg = document.createElement("div");
          allowedMsg.className = "dc-msg dc-msg-allowed";
          const toolTags = data.allowed_tools
            .map((t) => `<span class="dc-tool-tag dc-tool-allow">✓ ${t}</span>`)
            .join(" ");
          allowedMsg.innerHTML = __html.createHTML(
            `<span style="color:var(--success);">${LANG === "de" ? "Ausgeführt" : "Executed"}</span> ${toolTags}`,
          );
          area.appendChild(allowedMsg);
        }
      }

      if (dcHistory.length > 10) dcHistory = dcHistory.slice(-10);
      area.scrollTop = area.scrollHeight;
    } catch (err) {
      document.getElementById("dc-thinking")?.remove();
      const errMsg = document.createElement("div");
      errMsg.className = "dc-msg dc-msg-system";
      errMsg.textContent = "Error — try again.";
      area.appendChild(errMsg);
    }

    btn.disabled = false;
    btn.textContent = LANG === "de" ? "Senden" : "Send";
  };

  document.getElementById("dc-prompt").addEventListener("keydown", (e) => {
    if (e.key === "Enter") window.dcSend();
  });

  // Load initial stats
  fetch("/api/challenge/stats")
    .then((r) => r.json())
    .then((data) => {
      dcTotal = data.total || 0;
      dcDenied = data.denied || 0;
      dcCounts = {
        harm: data.by_prohibition?.harm || 0,
        exfiltrate: data.by_prohibition?.exfiltrate || 0,
        unregistered: data.by_prohibition?.unregistered || 0,
      };
      document.getElementById("dc-breaches").textContent = "0 breaches";
      updateCounts();
    })
    .catch(() => {});
})();

// ── Main app JS ──────────────────────────────────────────────────────────────
let currentLang = localStorage.getItem("ella-lang") || "en";

function showPage(id, pushState) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + id).classList.add("active");
  document
    .querySelectorAll("nav a")
    .forEach((a) => a.classList.remove("active"));
  const navMap = {
    ella: "nav-ella",
    "home-product": "nav-home",
    challenge: "nav-challenge",
    download: "nav-download",
    arm: "nav-arm",
    directive: "nav-directive",
  };
  if (navMap[id]) document.getElementById(navMap[id])?.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (pushState !== false)
    history.pushState({ page: id }, "", id === "home" ? "/" : "#" + id);
}

window.addEventListener("popstate", (e) => {
  const id = e.state?.page || "home";
  showPage(id, false);
});

document.addEventListener("DOMContentLoaded", () => {
  const hash = location.hash.replace("#", "");
  if (hash && document.getElementById("page-" + hash)) showPage(hash, false);
});

function applyLangToPlaceholders(lang) {
  document.querySelectorAll("[data-placeholder-en]").forEach((el) => {
    const text = el.getAttribute("data-placeholder-" + lang);
    if (text) el.placeholder = text;
  });
}

function toggleLang() {
  currentLang = currentLang === "en" ? "de" : "en";
  document.querySelector(".lang-toggle").textContent =
    currentLang === "en" ? "DE" : "EN";
  document.querySelectorAll("[data-en]").forEach((el) => {
    const text = el.getAttribute("data-" + currentLang);
    if (text) el.innerHTML = __html.createHTML(text);
  });
  applyLangToPlaceholders(currentLang);
  document.documentElement.lang = currentLang;
  localStorage.setItem("ella-lang", currentLang);
}

function applyInitialLang() {
  if (currentLang === "de") {
    document.querySelector(".lang-toggle").textContent = "EN";
    document.querySelectorAll("[data-en]").forEach((el) => {
      const text = el.getAttribute("data-de");
      if (text) el.innerHTML = __html.createHTML(text);
    });
    applyLangToPlaceholders("de");
    document.documentElement.lang = "de";
  }
}

document.addEventListener("DOMContentLoaded", applyInitialLang);

fetch("/api/stats/pageview", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    path: location.pathname + location.hash,
    ref: document.referrer,
  }),
}).catch(() => {});

function openModal(id) {
  document.getElementById(id).classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
  document.body.style.overflow = "";
}
function closeModalOnBg(e) {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.remove("open");
    document.body.style.overflow = "";
  }
}

async function submitNewsletter(e) {
  e.preventDefault();
  const email = document.getElementById("newsletter-email").value.trim();
  const msg = document.getElementById("newsletter-msg");
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    msg.style.display = "block";
    if (res.ok) {
      msg.style.color = "var(--accent2)";
      msg.textContent =
        currentLang === "de"
          ? "Danke! Du bist auf der Liste."
          : "Thanks! You're on the list.";
      e.target.reset();
    } else {
      msg.style.color = "#e07a7a";
      msg.textContent =
        data.message ||
        (currentLang === "de"
          ? "Fehler. Bitte versuche es später erneut."
          : "Error. Please try again later.");
      btn.disabled = false;
    }
  } catch {
    msg.style.display = "block";
    msg.style.color = "#e07a7a";
    msg.textContent =
      currentLang === "de" ? "Verbindungsfehler." : "Connection error.";
    btn.disabled = false;
  }
}

async function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById("contact-name").value.trim();
  const email = document.getElementById("contact-email").value.trim();
  const message = document.getElementById("contact-message").value.trim();
  const msg = document.getElementById("contact-msg");
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    msg.style.display = "block";
    if (res.ok) {
      msg.style.color = "var(--accent2)";
      msg.textContent =
        currentLang === "de"
          ? "Nachricht gesendet! Wir melden uns innerhalb von 24–48 Stunden."
          : "Message sent! We'll get back to you within 24–48 hours.";
      e.target.reset();
    } else {
      msg.style.color = "#e07a7a";
      msg.textContent =
        currentLang === "de"
          ? "Fehler beim Senden. Bitte per E-Mail kontaktieren."
          : "Send error. Please contact us by email.";
      btn.disabled = false;
    }
  } catch {
    msg.style.display = "block";
    msg.style.color = "#e07a7a";
    msg.textContent =
      currentLang === "de"
        ? "Verbindungsfehler. Bitte schreib uns an andre.zabel71@gmail.com"
        : "Connection error. Please email us at andre.zabel71@gmail.com";
    btn.disabled = false;
  }
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach((m) => {
      m.classList.remove("open");
      document.body.style.overflow = "";
    });
  }
});

// ── Gallery carousel ──────────────────────────────────────────────────────────
(function () {
  const VISIBLE = 3,
    GAP = 17.6;
  const track = document.getElementById("g-track");
  if (!track) return;
  const cards = [...track.children];
  const total = cards.length,
    steps = total - VISIBLE + 1;
  let gPos = 0,
    gMIdx = 0;

  const modalEl = document.getElementById("g-modal");
  const modalImg = document.getElementById("g-modal-img");

  // dots
  const dotsEl = document.getElementById("g-dots");
  for (let i = 0; i < steps; i++) {
    const d = document.createElement("button");
    d.className = "g-dot" + (i === 0 ? " active" : "");
    d.setAttribute("aria-label", "Galerie-Bild " + (i + 1) + " von " + steps);
    d.addEventListener("click", () => gGoTo(i));
    dotsEl.appendChild(d);
  }

  function gCW() {
    return (
      (document.querySelector(".g-track-wrap").offsetWidth -
        GAP * (VISIBLE - 1)) /
      VISIBLE
    );
  }
  function gSetWidths() {
    const w = gCW();
    cards.forEach((c) => {
      c.style.flex = "0 0 " + w + "px";
      c.style.width = w + "px";
    });
  }
  function gGoTo(p) {
    gSetWidths();
    gPos = Math.max(0, Math.min(p, steps - 1));
    track.style.transform = "translateX(-" + gPos * (gCW() + GAP) + "px)";
    document
      .querySelectorAll(".g-dot")
      .forEach((d, i) => d.classList.toggle("active", i === gPos));
    const bp = document.getElementById("g-bot-prev");
    const bn = document.getElementById("g-bot-next");
    if (bp) bp.disabled = gPos === 0;
    if (bn) bn.disabled = gPos === steps - 1;
    const ctr = document.getElementById("g-counter");
    if (ctr)
      ctr.textContent =
        gPos + 1 + "–" + Math.min(gPos + VISIBLE, total) + " / " + total;
  }

  // bottom nav buttons
  const botPrev = document.getElementById("g-bot-prev");
  const botNext = document.getElementById("g-bot-next");
  if (botPrev) botPrev.addEventListener("click", () => gGoTo(gPos - 1));
  if (botNext) botNext.addEventListener("click", () => gGoTo(gPos + 1));

  window.addEventListener("resize", () => gGoTo(gPos));
  gSetWidths();
  gGoTo(0);

  // card click → modal
  function gRenderModal(i) {
    const c = cards[i];
    const l = localStorage.getItem("ella-lang") || "en";
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    if (modalImg) {
      modalImg.src = c.dataset["img" + cap(l)] || "";
      modalImg.alt = c.dataset["title" + cap(l)] || "";
    }
    const badge = document.getElementById("g-modal-badge");
    const title = document.getElementById("g-modal-title");
    const desc = document.getElementById("g-modal-desc");
    const ctr = document.getElementById("g-modal-counter");
    if (badge) badge.textContent = c.dataset["badge" + cap(l)] || "";
    if (title) title.textContent = c.dataset["title" + cap(l)] || "";
    if (desc) desc.textContent = c.dataset["desc" + cap(l)] || "";
    if (ctr) ctr.textContent = i + 1 + " / " + total;
  }
  function gOpenModal(i) {
    gMIdx = i;
    gRenderModal(i);
    if (modalEl) {
      modalEl.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  }
  function gCloseModal() {
    if (modalEl) {
      modalEl.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  cards.forEach((card, idx) =>
    card.addEventListener("click", () => gOpenModal(idx)),
  );

  // modal close
  const closeBtn = document.querySelector(".g-modal-close");
  if (closeBtn) closeBtn.addEventListener("click", gCloseModal);
  if (modalEl)
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) gCloseModal();
    });

  // modal nav arrows
  const navBtns = document.querySelectorAll(".g-modal-nav-btns button");
  if (navBtns[0])
    navBtns[0].addEventListener("click", () => {
      gMIdx = (gMIdx - 1 + total) % total;
      gRenderModal(gMIdx);
    });
  if (navBtns[1])
    navBtns[1].addEventListener("click", () => {
      gMIdx = (gMIdx + 1) % total;
      gRenderModal(gMIdx);
    });

  // keyboard
  document.addEventListener("keydown", (e) => {
    if (!modalEl?.classList.contains("open")) return;
    if (e.key === "Escape") gCloseModal();
    if (e.key === "ArrowLeft") {
      gMIdx = (gMIdx - 1 + total) % total;
      gRenderModal(gMIdx);
    }
    if (e.key === "ArrowRight") {
      gMIdx = (gMIdx + 1) % total;
      gRenderModal(gMIdx);
    }
  });

  // swipe
  let tx = 0;
  track.addEventListener(
    "touchstart",
    (e) => {
      tx = e.touches[0].clientX;
    },
    { passive: true },
  );
  track.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) gGoTo(gPos + (dx < 0 ? 1 : -1));
  });
})();

// ── TESTIMONIALS ──
(function () {
  // load real testimonials
  fetch('/api/testimonials')
    .then(r => r.json())
    .then(data => {
      const grid = document.querySelector('.t-grid');
      if (!grid || !data.testimonials || !data.testimonials.length) return;
      const placeholders = grid.querySelectorAll('.t-card.placeholder');
      data.testimonials.forEach((t, i) => {
        if (i >= placeholders.length) return;
        const stars = '★'.repeat(t.stars) + '<span class="t-star empty">★</span>'.repeat(5 - t.stars);
        const initials = t.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        placeholders[i].classList.remove('placeholder');
        placeholders[i].innerHTML =
          '<div class="t-stars">' + Array.from({length: 5}, (_, j) =>
            '<span class="t-star' + (j < t.stars ? '' : ' empty') + '">★</span>').join('') + '</div>' +
          '<div class="t-quote">' + t.text + '</div>' +
          '<div class="t-author"><div class="t-avatar">' + initials + '</div><div>' +
          '<div class="t-author-name">' + t.name + '</div>' +
          '<div class="t-author-role">' + (t.role || '') + '</div></div></div>';
      });
    })
    .catch(() => {});

  // star picker
  let selectedStars = 0;
  const starEls = document.querySelectorAll('.t-pick-star');
  function paintStars(n) {
    starEls.forEach(s => {
      s.style.color = parseInt(s.dataset.v) <= n ? '#fbbf24' : 'var(--border)';
    });
  }
  starEls.forEach(s => {
    s.addEventListener('mouseenter', () => paintStars(parseInt(s.dataset.v)));
    s.addEventListener('mouseleave', () => paintStars(selectedStars));
    s.addEventListener('click', () => { selectedStars = parseInt(s.dataset.v); paintStars(selectedStars); });
  });

  // char counter
  const ta = document.getElementById('t-text');
  const charEl = document.getElementById('t-char');
  if (ta && charEl) ta.addEventListener('input', () => { charEl.textContent = ta.value.length; });

  // submit
  const btn = document.getElementById('t-submit');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const name = document.getElementById('t-name').value.trim();
    const role = document.getElementById('t-role').value.trim();
    const text = document.getElementById('t-text').value.trim();
    const key  = document.getElementById('t-key').value.trim();
    const msg  = document.getElementById('t-msg');

    if (!selectedStars) { showMsg(msg, 'Bitte wähle eine Bewertung (Sterne).', '#f59e0b'); return; }
    if (!name)          { showMsg(msg, 'Name ist erforderlich.', '#f59e0b'); return; }
    if (!text)          { showMsg(msg, 'Bitte schreib etwas über deine Erfahrung.', '#f59e0b'); return; }
    if (!key)           { showMsg(msg, 'Lizenzschlüssel ist erforderlich.', '#f59e0b'); return; }

    btn.disabled = true;
    btn.textContent = '...';

    try {
      const res = await fetch('/api/testimonial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key, name, role, stars: selectedStars, text })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('t-form-wrap').innerHTML =
          '<div style="text-align:center;padding:2rem;color:var(--text);">' +
          '<div style="font-size:2rem;margin-bottom:0.75rem;">🙏</div>' +
          '<div style="font-weight:700;margin-bottom:0.5rem;">Danke für deine Bewertung!</div>' +
          '<div style="color:var(--muted);font-size:0.85rem;">Sie wird nach Prüfung hier erscheinen.</div>' +
          '</div>';
      } else {
        const errors = { missing_params: 'Bitte alle Pflichtfelder ausfüllen.', invalid_key: 'Ungültiges Schlüsselformat.', key_not_found: 'Lizenzschlüssel nicht gefunden.', text_too_long: 'Text zu lang (max. 500 Zeichen).', invalid_stars: 'Ungültige Sternzahl.' };
        showMsg(msg, errors[data.error] || 'Fehler beim Absenden.', '#ef4444');
        btn.disabled = false; btn.textContent = 'Bewertung absenden';
      }
    } catch (e) {
      showMsg(msg, 'Verbindungsfehler. Bitte erneut versuchen.', '#ef4444');
      btn.disabled = false; btn.textContent = 'Bewertung absenden';
    }
  });

  function showMsg(el, text, color) {
    el.textContent = text; el.style.color = color; el.style.display = 'block';
  }
})();

// ── Contact Form ──────────────────────────────────────────────────────────────
window.submitContact = async function(e) {
  e.preventDefault();
  const name    = document.getElementById('contact-name')?.value.trim();
  const email   = document.getElementById('contact-email')?.value.trim();
  const subject = document.getElementById('contact-subject')?.value.trim();
  const message = document.getElementById('contact-message')?.value.trim();
  const msgEl   = document.getElementById('contact-msg');
  const btn     = e.target.querySelector('[type=submit]');
  if (!name || !email || !message) {
    if (msgEl) { msgEl.textContent = 'Bitte alle Pflichtfelder ausfüllen.'; msgEl.style.color='#f59e0b'; msgEl.style.display='block'; }
    return;
  }
  btn.disabled = true;
  try {
    const res  = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, subject, message }) });
    const data = await res.json();
    if (data.success) {
      e.target.innerHTML = '<p style="color:#4ade80;text-align:center;padding:1rem">&#10003; Nachricht gesendet &#8212; wir melden uns innerhalb von 24&#8211;48 Stunden.</p>';
    } else {
      if (msgEl) { msgEl.textContent = 'Fehler beim Senden.'; msgEl.style.color='#ef4444'; msgEl.style.display='block'; }
      btn.disabled = false;
    }
  } catch(err) {
    if (msgEl) { msgEl.textContent = 'Verbindungsfehler. Bitte später erneut versuchen.'; msgEl.style.color='#ef4444'; msgEl.style.display='block'; }
    btn.disabled = false;
  }
};

// ── Newsletter Form ───────────────────────────────────────────────────────────
window.submitNewsletter = async function(e) {
  e.preventDefault();
  const email = document.getElementById('newsletter-email')?.value.trim();
  const msgEl = document.getElementById('newsletter-msg');
  const btn   = e.target.querySelector('[type=submit]');
  if (!email) return;
  btn.disabled = true;
  try {
    const res  = await fetch('/api/newsletter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (data.success) {
      e.target.innerHTML = '<p style="color:#4ade80;text-align:center;padding:1rem">&#10003; Du bist eingetragen &#8212; wir halten dich auf dem Laufenden.</p>';
    } else {
      if (msgEl) { msgEl.textContent = data.already_subscribed ? 'Du bist bereits eingetragen.' : 'Fehler beim Eintragen.'; msgEl.style.color='#f59e0b'; msgEl.style.display='block'; }
      btn.disabled = false;
    }
  } catch(err) {
    if (msgEl) { msgEl.textContent = 'Verbindungsfehler. Bitte später erneut versuchen.'; msgEl.style.color='#ef4444'; msgEl.style.display='block'; }
    btn.disabled = false;
  }
};
