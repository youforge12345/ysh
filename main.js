import { db, firebaseReady } from "./config.js";

/* ---------- Data loading: Firestore first, demo fallback ---------- */
async function loadCollection(name) {
  if (firebaseReady && db) {
    try {
      const { collection, getDocs, query, orderBy } =
        await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const q = query(collection(db, name), orderBy("order", "asc"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const active = docs.filter(d => (d.status ?? "active") === "active");
        if (active.length) return active;
      }
    } catch (err) {
      console.warn(`[YouForge] Could not load "${name}" from Firestore, using demo data.`, err);
    }
  }
  const demo = (window.YF_DEMO && window.YF_DEMO[name]) || [];
  return demo.filter(d => (d.status ?? "active") === "active").sort((a,b) => (a.order??0)-(b.order??0));
}

/* ---------- Renderers ---------- */
function renderCards(containerId, items) {
  const container = document.getElementById(containerId);
  const tpl = document.getElementById("tpl-card");
  container.innerHTML = "";
  if (!items.length) { container.innerHTML = `<p class="empty-note">Nothing published here yet — check back soon.</p>`; return; }
  items.forEach((item, i) => {
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector("img");
    img.src = item.image || "";
    img.alt = item.name || "";
    node.querySelector(".card-title").textContent = item.name || "Untitled";
    node.querySelector(".card-desc").textContent = item.description || "";
    node.querySelector(".card-count").textContent = `${item.memberCount || "—"} Members`;
    const join = node.querySelector(".btn-join");
    join.href = item.link || "#";
    const article = node.querySelector(".card");
    article.style.transitionDelay = `${Math.min(i,6) * 60}ms`;
    container.appendChild(node);
  });
  observeReveal(container.querySelectorAll(".card"));
  attachTilt(container.querySelectorAll(".card"));
}

function renderRows(containerId, items, unitLabel = "Members") {
  const container = document.getElementById(containerId);
  const tpl = document.getElementById("tpl-row");
  container.innerHTML = "";
  if (!items.length) { container.innerHTML = `<p class="empty-note">Nothing published here yet — check back soon.</p>`; return; }
  items.forEach((item) => {
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector(".row-img");
    img.src = item.image || "";
    img.alt = item.name || "";
    node.querySelector(".row-title").textContent = item.name || "Untitled";
    node.querySelector(".row-desc").textContent = item.description || "";
    node.querySelector(".row-count").textContent = `${item.memberCount || "—"} ${unitLabel}`;
    const join = node.querySelector(".btn-join");
    join.href = item.link || "#";
    container.appendChild(node);
  });
  observeReveal(container.querySelectorAll(".row-card"));
}

const CONTACT_META = {
  whatsapp: { ico: "WA", grad: true },
  telegram: { ico: "TG", grad: true },
  email:    { ico: "@" },
  website:  { ico: "W" }
};

function renderContacts(containerId, items) {
  const container = document.getElementById(containerId);
  const tpl = document.getElementById("tpl-contact");
  container.innerHTML = "";
  items.forEach((item) => {
    const node = tpl.content.cloneNode(true);
    const meta = CONTACT_META[item.type] || { ico: "?" };
    node.querySelector(".contact-ico").textContent = meta.ico;
    node.querySelector(".contact-title").textContent = item.name || "Contact";
    node.querySelector(".contact-value").textContent = item.value || "";
    const open = node.querySelector(".btn-ghost");
    open.href = item.link || "#";
    container.appendChild(node);
  });
  observeReveal(container.querySelectorAll(".contact-card"));
}

/* ---------- Scroll reveal ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

function observeReveal(nodes) {
  nodes.forEach(n => { n.classList.add("reveal"); revealObserver.observe(n); });
}

/* ---------- 3D tilt on hover ---------- */
function attachTilt(cards) {
  cards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y*7).toFixed(2)}deg) rotateY(${(x*9).toFixed(2)}deg) translateY(-6px)`;
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });
}

/* ---------- Animated counters ---------- */
function animateCounters() {
  const nums = document.querySelectorAll(".stat-num");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || "";
      const duration = 1600;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach(n => obs.observe(n));
}

/* ---------- Nav behavior ---------- */
function initNav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 30);
  }, { passive: true });
  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
    document.body.style.overflow = links.classList.contains("open") ? "hidden" : "";
  });
  links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    links.classList.remove("open");
    document.body.style.overflow = "";
  }));
}

/* ---------- Cursor glow + hero parallax ---------- */
function initParallax() {
  const glow = document.getElementById("cursorGlow");
  const visual = document.getElementById("heroVisual");
  window.addEventListener("mousemove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
    if (visual) {
      const relX = (e.clientX / window.innerWidth - 0.5) * 16;
      const relY = (e.clientY / window.innerHeight - 0.5) * 16;
      visual.style.transform = `translate3d(${relX}px, ${relY}px, 0)`;
    }
  }, { passive: true });
}

/* ---------- Boot ---------- */
async function boot() {
  document.getElementById("year").textContent = new Date().getFullYear();
  initNav();
  initParallax();
  animateCounters();
  observeReveal(document.querySelectorAll(".hero-copy, .hero-visual, .stats, .section-head"));

  const [communities, groups, waChannels, tgChannels, tgGroups, contacts] = await Promise.all([
    loadCollection("whatsapp_communities"),
    loadCollection("whatsapp_groups"),
    loadCollection("whatsapp_channels"),
    loadCollection("telegram_channels"),
    loadCollection("telegram_groups"),
    loadCollection("contacts"),
  ]);

  renderCards("communitiesTrack", communities);
  renderRows("groupsList", groups, "Members");
  renderCards("waChannelsTrack", waChannels);
  renderCards("tgChannelsTrack", tgChannels);
  renderRows("tgGroupsList", tgGroups, "Members");
  renderContacts("contactGrid", contacts);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot(); // DOMContentLoaded may have already fired while this module awaited Firebase
}

/* ---------- PWA service worker ---------- */
if ("serviceWorker" in navigator) {
  if (document.readyState === "complete") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
}
