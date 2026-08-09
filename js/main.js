import { initFirebase } from "./config.js?v=12";

let db = null;
let firebaseReady = false;
let firebaseInitError = null;

/* ---------- Data loading: Firestore only, no demo fallback ---------- */
async function loadCollection(name) {
  if (!firebaseReady || !db) return [];
  try {
    const { collection, getDocs, query, orderBy } =
      await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const q = query(collection(db, name), orderBy("order", "asc"));
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return docs.filter(d => (d.status ?? "active") === "active");
  } catch (err) {
    console.warn(`[YouForge] Could not load "${name}" from Firestore.`, err);
    return [];
  }
}

/* ---------- Homepage section order (admin-controlled) ---------- */
const SECTION_ORDER_MAP = [
  { key: "communities",       id: "communities" },
  { key: "groups",             id: "groups" },
  { key: "channels",           id: "channels" },
  { key: "telegramChannels",   id: "telegram" },
  { key: "telegramGroups",     id: "telegram-groups" },
  { key: "contact",            id: "contact" },
  { key: "website",            id: "website" },
];

async function loadSectionOrder() {
  if (firebaseReady && db) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const snap = await getDoc(doc(db, "settings", "sectionOrder"));
      if (snap.exists()) return snap.data();
    } catch (err) {
      console.warn("[YouForge] Could not load section order, using default.", err);
    }
  }
  return null;
}

function applySectionOrder(orderData) {
  const main = document.getElementById("top");
  if (!main) return;
  const entries = SECTION_ORDER_MAP
    .map((s, i) => {
      const el = document.getElementById(s.id);
      const order = orderData && orderData[s.key] != null ? Number(orderData[s.key]) : (i + 1);
      return { el, order };
    })
    .filter(e => e.el);
  entries.sort((a, b) => a.order - b.order);
  // Hero and stats are untouched here, so they always stay first;
  // appendChild moves each of these sections to the end in the chosen order.
  entries.forEach(e => main.appendChild(e.el));
}

/* ---------- Section eyebrow/heading text (admin-controlled) ---------- */
async function loadSectionText() {
  if (firebaseReady && db) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const snap = await getDoc(doc(db, "settings", "sectionText"));
      if (snap.exists()) return snap.data();
    } catch (err) {
      console.warn("[YouForge] Could not load section text, using defaults.", err);
    }
  }
  return null;
}

function applySectionText(data) {
  if (!data) return;
  SECTION_ORDER_MAP.forEach(s => {
    const cfg = data[s.key];
    if (!cfg) return;
    const section = document.getElementById(s.id);
    const head = section && section.querySelector(".section-head");
    if (!head) return;

    const eyebrowEl = head.querySelector(".eyebrow");
    const h2 = head.querySelector("h2");

    if (eyebrowEl) {
      if (cfg.badgeVisible === false) {
        eyebrowEl.hidden = true;
      } else {
        eyebrowEl.hidden = false;
        if (cfg.eyebrow != null && cfg.eyebrow !== "") {
          const bullet = eyebrowEl.querySelector(".hex-bullet");
          eyebrowEl.textContent = "";
          if (bullet) eyebrowEl.appendChild(bullet);
          eyebrowEl.appendChild(document.createTextNode(" " + cfg.eyebrow));
        }
      }
    }

    if (h2) {
      if (cfg.headingVisible === false) {
        h2.hidden = true;
      } else {
        h2.hidden = false;
        if (cfg.heading != null && cfg.heading !== "") {
          h2.textContent = cfg.heading;
        }
      }
    }

    // If both are off, hide the wrapper too so it doesn't leave an empty gap.
    head.hidden = (cfg.badgeVisible === false) && (cfg.headingVisible === false);
  });
}

/* ---------- Homepage stats (admin-controlled) ---------- */
async function loadStats() {
  if (!firebaseReady || !db) return null;
  const defaults = window.YF_DEFAULT_STATS || {};
  try {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const snap = await getDoc(doc(db, "settings", "stats"));
    if (snap.exists()) return { ...defaults, ...snap.data() };
  } catch (err) {
    console.warn("[YouForge] Could not load homepage stats.", err);
  }
  return defaults;
}

function applyStats(stats) {
  const section = document.querySelector(".stats");
  const grid = document.getElementById("statsGrid");
  if (!grid || !section) return;

  if (!stats) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  const cards = grid.querySelectorAll(".stat-card");
  let visibleCount = 0;
  cards.forEach(card => {
    const key = card.dataset.key;
    const s = stats[key];
    if (s && s.visible === false) {
      card.style.display = "none";
      return;
    }
    visibleCount++;
    card.style.display = "";
    const num = card.querySelector(".stat-num");
    if (s) {
      if (s.value != null) num.dataset.count = s.value;
      if (s.suffix != null) num.dataset.suffix = s.suffix;
    }
  });
  grid.style.gridTemplateColumns = `repeat(auto-fit, minmax(min(150px, 100%), 1fr))`;
}

/* ---------- Fallback: a polished branded placeholder when no image is set ---------- */
const BRANDED_PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 188">
     <rect width="300" height="188" fill="#14120e"/>
     <polygon points="150,40 198,64 198,116 150,140 102,116 102,64" fill="none" stroke="#c9a961" stroke-width="2.5"/>
     <text x="150" y="105" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="15.5" letter-spacing="-0.5" fill="#f4d793">YouForge</text>
   </svg>`
);

function setItemImage(imgEl, item) {
  imgEl.src = item.image || BRANDED_PLACEHOLDER;
  imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = BRANDED_PLACEHOLDER; };
}

/* ---------- Renderers ---------- */
function renderCards(containerId, items) {
  const container = document.getElementById(containerId);
  const section = container.closest(".section");
  const tpl = document.getElementById("tpl-card");
  container.innerHTML = "";

  if (!items.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  items.forEach((item, i) => {
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector("img");
    setItemImage(img, item);
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
  const section = container.closest(".section");
  const tpl = document.getElementById("tpl-row");
  container.innerHTML = "";

  if (!items.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  items.forEach((item) => {
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector(".row-img");
    setItemImage(img, item);
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

const ICONS = {
  whatsapp: `<svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.4-1.5-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z"/><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>`,
  telegram: `<svg viewBox="0 0 24 24"><path d="M22 3.5 19 20.3c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.9L18.9 6c.4-.4-.1-.6-.6-.2L6.3 13.4 1.6 12c-1-.3-1-1 .2-1.4L20.7 2.4c.8-.3 1.6.2 1.3 1.1z"/></svg>`,
  email: `<svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2.24V6h.01L12 12l7.99-6H4zM20 18V8.3l-8 6-8-6V18h16z"/></svg>`,
  website: `<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.94 9h-3.1a15.6 15.6 0 0 0-1.2-5.3A8.03 8.03 0 0 1 19.94 11zM12 4.06c.9 1.2 1.8 3.2 2.1 4.94H9.9c.3-1.74 1.2-3.74 2.1-4.94zM4.06 11a8.03 8.03 0 0 1 4.36-5.3A15.6 15.6 0 0 0 7.16 11h-3.1zm0 2h3.1c.14 1.9.6 3.7 1.26 5.3A8.03 8.03 0 0 1 4.06 13zM12 19.94c-.9-1.2-1.8-3.2-2.1-4.94h4.2c-.3 1.74-1.2 3.74-2.1 4.94zm2.84-1.24c.66-1.6 1.12-3.4 1.26-5.3h3.1a8.03 8.03 0 0 1-4.36 5.3z"/></svg>`,
};

const CONTACT_META = {
  whatsapp: { icon: ICONS.whatsapp, cls: "wa" },
  telegram: { icon: ICONS.telegram, cls: "tg" },
  email:    { icon: ICONS.email, cls: "" },
  website:  { icon: ICONS.website, cls: "" },
};

function renderContacts(containerId, items) {
  const container = document.getElementById(containerId);
  const section = container.closest(".section");
  const tpl = document.getElementById("tpl-contact");
  container.innerHTML = "";

  if (!items.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;

  items.forEach((item) => {
    const node = tpl.content.cloneNode(true);
    const meta = CONTACT_META[item.type] || { icon: "", cls: "" };
    const icoEl = node.querySelector(".contact-ico");
    icoEl.innerHTML = meta.icon;
    if (meta.cls) icoEl.classList.add(meta.cls);
    node.querySelector(".contact-title").textContent = item.name || "Contact";
    node.querySelector(".contact-value").textContent = item.value || "";
    const open = node.querySelector(".btn-ghost");
    open.href = item.link || "#";
    container.appendChild(node);
  });
  observeReveal(container.querySelectorAll(".contact-card"));
}

/* ---------- Website section (its own collection, image cards) ---------- */
function renderWebsiteSection(items) {
  const containerId = "websiteTrack";
  const container = document.getElementById(containerId);
  const section = container.closest(".section");
  const navLink = document.getElementById("navWebsite");
  const tpl = document.getElementById("tpl-card");
  container.innerHTML = "";

  if (!items.length) {
    if (section) section.hidden = true;
    if (navLink) navLink.hidden = true;
    return;
  }
  if (section) section.hidden = false;
  if (navLink) navLink.hidden = false;

  items.forEach((item, i) => {
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector("img");
    setItemImage(img, item);
    img.alt = item.name || "";
    node.querySelector(".card-title").textContent = item.name || "Untitled";
    node.querySelector(".card-desc").textContent = item.description || "";
    node.querySelector(".card-meta").style.display = "none"; // member counts don't apply to a website link
    const join = node.querySelector(".btn-join");
    join.href = item.link || "#";
    join.childNodes[0].textContent = "Visit "; // relabel without touching the arrow icon
    const article = node.querySelector(".card");
    article.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
    container.appendChild(node);
  });
  observeReveal(container.querySelectorAll(".card"));
  attachTilt(container.querySelectorAll(".card"));
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

  initBottomTabbar();
}

/* ---------- Mobile bottom tab bar: highlight the section currently in view ---------- */
function initBottomTabbar() {
  const tabbar = document.getElementById("mobileTabbar");
  if (!tabbar) return;
  const tabLinks = [...tabbar.querySelectorAll("a")];
  const sectionIds = ["top", "communities", "groups", "channels", "contact"];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  function setActive(id) {
    tabLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
  }
  setActive("top");

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
  sections.forEach(s => obs.observe(s));
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

/* ---------- Visible diagnostics: shows the real reason if live data can't load ---------- */
function showDataWarningBanner(message) {
  if (document.getElementById("dataWarningBanner")) return;
  const bar = document.createElement("div");
  bar.id = "dataWarningBanner";
  bar.setAttribute("role", "status");
  bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:999;background:#3a1f14;color:#ffd9b3;font:600 12.5px/1.5 -apple-system,system-ui,sans-serif;padding:10px 16px;text-align:center;border-top:1px solid #c9a961;";
  bar.innerHTML = `⚠ Showing demo content — live data failed to load (${message}). <button id="dataWarningClose" style="margin-left:10px;background:none;border:1px solid #ffd9b3;color:#ffd9b3;border-radius:6px;padding:3px 9px;font:inherit;cursor:pointer;">Dismiss</button>`;
  document.body.appendChild(bar);
  document.getElementById("dataWarningClose").addEventListener("click", () => bar.remove());
}

/* ---------- Boot ---------- */
async function boot() {
  const fb = await initFirebase();
  db = fb.db;
  firebaseReady = fb.firebaseReady;
  firebaseInitError = fb.firebaseInitError;

  document.getElementById("year").textContent = new Date().getFullYear();
  initNav();
  initParallax();
  observeReveal(document.querySelectorAll(".hero-copy, .hero-visual, .stats, .section-head"));

  const sectionOrder = await loadSectionOrder();
  applySectionOrder(sectionOrder);

  const sectionText = await loadSectionText();
  applySectionText(sectionText);

  const stats = await loadStats();
  applyStats(stats);
  animateCounters();

  const [communities, groups, waChannels, tgChannels, tgGroups, contacts, websiteItems] = await Promise.all([
    loadCollection("whatsapp_communities"),
    loadCollection("whatsapp_groups"),
    loadCollection("whatsapp_channels"),
    loadCollection("telegram_channels"),
    loadCollection("telegram_groups"),
    loadCollection("contacts"),
    loadCollection("website"),
  ]);

  renderCards("communitiesTrack", communities);
  renderRows("groupsList", groups, "Members");
  renderCards("waChannelsTrack", waChannels);
  renderCards("tgChannelsTrack", tgChannels);
  renderRows("tgGroupsList", tgGroups, "Members");
  renderContacts("contactGrid", contacts);
  renderWebsiteSection(websiteItems);

  if (!firebaseReady) {
    showDataWarningBanner(firebaseInitError || "connection did not complete on this device/network");
  }
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
