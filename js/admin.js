import { initFirebase, cloudinaryConfig, cloudinaryReady } from "./config.js?v=17";

let auth = null, db = null, firebaseReady = false;

/* ---------- State ---------- */
const COLLECTIONS = {
  whatsapp_communities: { label: "WhatsApp Communities", hasMembers: true, isContact: false },
  whatsapp_groups:      { label: "WhatsApp Groups",      hasMembers: true, isContact: false },
  whatsapp_channels:    { label: "WhatsApp Channels",    hasMembers: true, isContact: false },
  telegram_channels:    { label: "Telegram Channels",    hasMembers: true, isContact: false },
  telegram_groups:      { label: "Telegram Groups",      hasMembers: true, isContact: false },
  website:              { label: "Website",              hasMembers: false, isContact: false },
  contacts:             { label: "Contacts",             hasMembers: false, isContact: true },
};

let currentTab = "whatsapp_communities";
let editingId = null;

/* ---------- Elements ---------- */
const $ = (id) => document.getElementById(id);
const loginScreen = $("loginScreen");
const adminShell = $("adminShell");
const loginForm = $("loginForm");
const loginNote = $("loginNote");
const logoutBtn = $("logoutBtn");
const whoami = $("whoami");
const adminNav = $("adminNav");
const tabTitle = $("tabTitle");
const tableBody = $("adminTableBody");
const adminEmpty = $("adminEmpty");
const addNewBtn = $("addNewBtn");

const itemModal = $("itemModal");
const itemForm = $("itemForm");
const modalTitle = $("modalTitle");
const modalError = $("modalError");
const typeRow = $("typeRow");
const descLabel = $("descLabel");
const fName = $("fName"), fDescription = $("fDescription"), fMemberCount = $("fMemberCount"),
      fOrder = $("fOrder"), fLink = $("fLink"), fImageFile = $("fImageFile"), fImageUrl = $("fImageUrl"),
      fStatus = $("fStatus"), fContactType = $("fContactType");
const imagePreview = $("imagePreview"), imagePreviewImg = $("imagePreviewImg");
const toastEl = $("toast");

const collectionView = $("collectionView");
const statsPanel = $("statsPanel");
const saveStatsBtn = $("saveStatsBtn");
const statsSavedNote = $("statsSavedNote");
const STAT_KEYS = ["communities", "groups", "channels", "members"];
const STAT_DEFAULTS = {
  communities: { value: "25", suffix: "+" },
  groups:      { value: "120", suffix: "+" },
  channels:    { value: "40", suffix: "+" },
  members:     { value: "10", suffix: "K+" },
};

const orderPanel = $("orderPanel");
const saveOrderBtn = $("saveOrderBtn");
const orderSavedNote = $("orderSavedNote");
const ORDER_KEYS = ["communities", "groups", "channels", "telegramChannels", "telegramGroups", "contact", "website"];
const ORDER_DEFAULTS = { communities:1, groups:2, channels:3, telegramChannels:4, telegramGroups:5, contact:6, website:7 };

const textPanel = $("textPanel");
const saveTextBtn = $("saveTextBtn");
const textSavedNote = $("textSavedNote");
const TEXT_DEFAULTS = {
  communities:       { eyebrow: "WhatsApp Communities", heading: "Communities worth joining" },
  groups:             { eyebrow: "WhatsApp Groups",       heading: "Daily signal & discussion" },
  channels:           { eyebrow: "WhatsApp Channels",     heading: "Broadcasts & updates" },
  telegramChannels:   { eyebrow: "Telegram Channels",     heading: "Follow the forge on Telegram" },
  telegramGroups:     { eyebrow: "Telegram Groups",       heading: "Talk shop, live" },
  contact:            { eyebrow: "Reach Us",               heading: "Need a hand?" },
  website:            { eyebrow: "Official Website",       heading: "Visit our website" },
};

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 2600);
}

/* ---------- Auth ---------- */
async function initAuth() {
  if (firebaseReady && auth) {
    const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    onAuthStateChanged(auth, (user) => {
      if (user) {
        loginScreen.hidden = true;
        adminShell.hidden = false;
        whoami.textContent = user.email;
        renderTab(currentTab);
      } else {
        loginScreen.hidden = false;
        adminShell.hidden = true;
      }
    });
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  loginNote.textContent = "";

  if (!firebaseReady || !auth) {
    loginNote.textContent = "Firebase isn't connected yet — check js/config.js.";
    return;
  }

  try {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginNote.textContent = "Sign-in failed — check your email and password.";
    console.warn(err);
  }
});

logoutBtn.addEventListener("click", async () => {
  if (firebaseReady && auth) {
    const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    await signOut(auth);
  }
});

/* ---------- Tab switching ---------- */
function showPanel(which) {
  addNewBtn.hidden = which !== "collection";
  collectionView.hidden = which !== "collection";
  statsPanel.hidden = which !== "stats";
  orderPanel.hidden = which !== "order";
  textPanel.hidden = which !== "text";
}

adminNav.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tab]");
  if (!btn) return;
  adminNav.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentTab = btn.dataset.tab;

  if (currentTab === "stats") {
    tabTitle.textContent = "Homepage Stats";
    showPanel("stats");
    loadStatsForm();
  } else if (currentTab === "order") {
    tabTitle.textContent = "Section Order";
    showPanel("order");
    loadOrderForm();
  } else if (currentTab === "text") {
    tabTitle.textContent = "Section Text";
    showPanel("text");
    loadTextForm();
  } else {
    tabTitle.textContent = COLLECTIONS[currentTab].label;
    showPanel("collection");
    renderTab(currentTab);
  }
  const mobileTitle = $("mobileTabTitle");
  if (mobileTitle) mobileTitle.textContent = tabTitle.textContent;
  closeMobileSidebar();
});

/* ---------- Mobile sidebar drawer ---------- */
const adminSide = $("adminSide");
const adminSideToggle = $("adminSideToggle");
const adminSideBackdrop = $("adminSideBackdrop");

function openMobileSidebar() {
  adminSide.classList.add("open");
  adminSideBackdrop.classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeMobileSidebar() {
  adminSide.classList.remove("open");
  adminSideBackdrop.classList.remove("show");
  document.body.style.overflow = "";
}
if (adminSideToggle) {
  adminSideToggle.addEventListener("click", () => {
    adminSide.classList.contains("open") ? closeMobileSidebar() : openMobileSidebar();
  });
}
if (adminSideBackdrop) {
  adminSideBackdrop.addEventListener("click", closeMobileSidebar);
}

/* ---------- Homepage Stats ---------- */
async function loadStatsForm() {
  statsSavedNote.textContent = "";
  let data = {};
  if (firebaseReady && db) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const snap = await getDoc(doc(db, "settings", "stats"));
      if (snap.exists()) data = snap.data();
    } catch (err) {
      console.warn("[YouForge] Could not load stats.", err);
    }
  }
  STAT_KEYS.forEach(key => {
    const s = { ...STAT_DEFAULTS[key], visible: true, ...(data[key] || {}) };
    $(`stat_${key}_value`).value = s.value;
    $(`stat_${key}_suffix`).value = s.suffix;
    $(`stat_${key}_visible`).checked = s.visible !== false;
  });
}

saveStatsBtn.addEventListener("click", async () => {
  statsSavedNote.textContent = "Saving…";
  const payload = {};
  STAT_KEYS.forEach(key => {
    payload[key] = {
      value: $(`stat_${key}_value`).value.trim(),
      suffix: $(`stat_${key}_suffix`).value.trim(),
      visible: $(`stat_${key}_visible`).checked,
    };
  });
  try {
    if (!firebaseReady || !db) throw new Error("Firebase not connected");
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await setDoc(doc(db, "settings", "stats"), payload, { merge: true });
    statsSavedNote.textContent = "Saved — refresh the live site to see the change.";
    toast("Homepage stats updated.");
  } catch (err) {
    console.error(err);
    statsSavedNote.textContent = "Something went wrong saving stats.";
  }
});

/* ---------- Section Order ---------- */
async function loadOrderForm() {
  orderSavedNote.textContent = "";
  let data = {};
  if (firebaseReady && db) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const snap = await getDoc(doc(db, "settings", "sectionOrder"));
      if (snap.exists()) data = snap.data();
    } catch (err) {
      console.warn("[YouForge] Could not load section order.", err);
    }
  }
  ORDER_KEYS.forEach(key => {
    $(`order_${key}`).value = data[key] ?? ORDER_DEFAULTS[key];
  });
}

saveOrderBtn.addEventListener("click", async () => {
  orderSavedNote.textContent = "Saving…";
  const payload = {};
  ORDER_KEYS.forEach(key => {
    payload[key] = parseInt($(`order_${key}`).value, 10) || ORDER_DEFAULTS[key];
  });
  try {
    if (!firebaseReady || !db) throw new Error("Firebase not connected");
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await setDoc(doc(db, "settings", "sectionOrder"), payload, { merge: true });
    orderSavedNote.textContent = "Saved — refresh the live site to see the new order.";
    toast("Section order updated.");
  } catch (err) {
    console.error(err);
    orderSavedNote.textContent = "Something went wrong saving section order.";
  }
});

/* ---------- Section Text ---------- */
async function loadTextForm() {
  textSavedNote.textContent = "";
  let data = {};
  if (firebaseReady && db) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const snap = await getDoc(doc(db, "settings", "sectionText"));
      if (snap.exists()) data = snap.data();
    } catch (err) {
      console.warn("[YouForge] Could not load section text.", err);
    }
  }
  ORDER_KEYS.forEach(key => {
    const t = { ...TEXT_DEFAULTS[key], badgeVisible: true, headingVisible: true, ...(data[key] || {}) };
    $(`text_${key}_eyebrow`).value = t.eyebrow;
    $(`text_${key}_heading`).value = t.heading;
    $(`text_${key}_badgeVisible`).checked = t.badgeVisible !== false;
    $(`text_${key}_headingVisible`).checked = t.headingVisible !== false;
  });
}

saveTextBtn.addEventListener("click", async () => {
  textSavedNote.textContent = "Saving…";
  const payload = {};
  ORDER_KEYS.forEach(key => {
    payload[key] = {
      eyebrow: $(`text_${key}_eyebrow`).value.trim(),
      heading: $(`text_${key}_heading`).value.trim(),
      badgeVisible: $(`text_${key}_badgeVisible`).checked,
      headingVisible: $(`text_${key}_headingVisible`).checked,
    };
  });
  try {
    if (!firebaseReady || !db) throw new Error("Firebase not connected");
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await setDoc(doc(db, "settings", "sectionText"), payload, { merge: true });
    textSavedNote.textContent = "Saved — refresh the live site to see the change.";
    toast("Section text updated.");
  } catch (err) {
    console.error(err);
    textSavedNote.textContent = "Something went wrong saving section text.";
  }
});

/* ---------- Data access ---------- */
async function fetchItems(tab) {
  const { collection, getDocs, query, orderBy } =
    await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const q = query(collection(db, tab), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function saveItem(tab, data, id) {
  const { collection, addDoc, doc, updateDoc } =
    await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  if (id) await updateDoc(doc(db, tab, id), data);
  else await addDoc(collection(db, tab), data);
}

async function deleteItem(tab, id) {
  const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  await deleteDoc(doc(db, tab, id));
}

async function uploadImage(tab, file) {
  if (!cloudinaryReady) return null; // falls back to pasted URL / data-URL preview
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", cloudinaryConfig.uploadPreset);
  form.append("folder", `youforge/${tab}`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const json = await res.json();
  return json.secure_url;
}

/* ---------- Render table ---------- */
async function renderTab(tab) {
  tableBody.innerHTML = `<tr><td colspan="8" style="color:var(--ink-faint);padding:20px;">Loading…</td></tr>`;
  const items = await fetchItems(tab);
  const isContact = COLLECTIONS[tab].isContact;
  tableBody.innerHTML = "";
  adminEmpty.hidden = items.length > 0;

  items.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Order">${item.order ?? "—"}</td>
      <td data-label="Image">${item.image ? `<img class="thumb" src="${item.image}" alt="">` : (item.link ? `<img class="thumb is-favicon" src="${faviconFallback(item.link)}" alt="">` : "—")}</td>
      <td data-label="Name" class="cell-name">${escapeHtml(item.name || "")}</td>
      <td data-label="${isContact ? "Value" : "Description"}" class="cell-desc">${escapeHtml(isContact ? (item.value || "") : (item.description || ""))}</td>
      <td data-label="Members">${(isContact || !COLLECTIONS[tab].hasMembers) ? "—" : (item.memberCount || "—")}</td>
      <td data-label="Status"><span class="status-pill ${item.status === "inactive" ? "inactive" : "active"}">${item.status === "inactive" ? "Inactive" : "Active"}</span></td>
      <td data-label="Link"><a href="${item.link || "#"}" target="_blank" rel="noopener" style="color:var(--gold-1);">Open ↗</a></td>
      <td data-label="" class="row-actions">
        <button data-action="edit" data-id="${item.id}">Edit</button>
        <button data-action="delete" data-id="${item.id}" class="danger">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === "edit") {
        openModal(items.find(i => i.id === id), id);
      } else {
        if (confirm("Delete this item? This cannot be undone.")) {
          await deleteItem(tab, id);
          toast("Item deleted.");
          renderTab(tab);
        }
      }
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s]));
}

function faviconFallback(link) {
  if (!link) return "";
  try {
    const hostname = new URL(link).hostname;
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch {
    return "";
  }
}

/* ---------- Modal ---------- */
function updateContactTypeUI() {
  const type = fContactType.value;
  const linkLabel = fLink.closest("label");
  if (type === "whatsapp") {
    fDescription.placeholder = "e.g. 923001234567 (country code + number, no + or spaces)";
    linkLabel.style.display = "none";
    fLink.required = false;
  } else if (type === "telegram") {
    fDescription.placeholder = "e.g. YouForgeSupport or @YouForgeSupport";
    linkLabel.style.display = "none";
    fLink.required = false;
  } else if (type === "email") {
    fDescription.placeholder = "e.g. support@youforge.com";
    linkLabel.style.display = "none";
    fLink.required = false;
  } else {
    fDescription.placeholder = "e.g. youforge.com";
    linkLabel.style.display = "";
    fLink.required = true;
  }
}
fContactType.addEventListener("change", updateContactTypeUI);

function openModal(item = null, id = null) {
  editingId = id;
  modalError.textContent = "";
  const isContact = COLLECTIONS[currentTab].isContact;
  const hasMembers = COLLECTIONS[currentTab].hasMembers;
  typeRow.hidden = !isContact;
  $("descHint").hidden = !isContact;
  descLabel.firstChild.textContent = isContact ? "Value / Handle" : "Description";
  fMemberCount.closest("label").style.display = (isContact || !hasMembers) ? "none" : "";
  fLink.closest("label").style.display = ""; // reset; updateContactTypeUI may hide it below
  fLink.required = true;

  modalTitle.textContent = item ? "Edit Item" : "Add New Item";
  fName.value = item?.name || "";
  fDescription.value = isContact ? (item?.value || "") : (item?.description || "");
  fMemberCount.value = item?.memberCount || "";
  fOrder.value = item?.order ?? 1;
  fLink.value = item?.link || "";
  fImageUrl.value = item?.image || "";
  fImageFile.value = "";
  fStatus.value = item?.status || "active";
  if (isContact) fContactType.value = item?.type || "whatsapp";
  if (isContact) updateContactTypeUI();

  if (item?.image) {
    imagePreviewImg.src = item.image;
    imagePreviewImg.classList.remove("is-favicon");
    imagePreview.hidden = false;
  } else if (item?.link) {
    imagePreviewImg.src = faviconFallback(item.link);
    imagePreviewImg.classList.add("is-favicon");
    imagePreview.hidden = false;
  } else {
    imagePreview.hidden = true;
  }
  itemModal.hidden = false;
}

function closeModal() { itemModal.hidden = true; itemForm.reset(); }

$("cancelModal").addEventListener("click", closeModal);
addNewBtn.addEventListener("click", () => openModal());

fImageUrl.addEventListener("input", () => {
  if (fImageUrl.value) { imagePreviewImg.src = fImageUrl.value; imagePreviewImg.classList.remove("is-favicon"); imagePreview.hidden = false; }
});
fImageFile.addEventListener("change", () => {
  const file = fImageFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { imagePreviewImg.src = reader.result; imagePreviewImg.classList.remove("is-favicon"); imagePreview.hidden = false; };
  reader.readAsDataURL(file);
});

itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  modalError.textContent = "";
  const saveBtn = $("saveBtn");
  saveBtn.disabled = true; saveBtn.textContent = "Saving…";

  try {
    let imageUrl = fImageUrl.value.trim();
    const file = fImageFile.files[0];
    if (file) {
      const uploaded = await uploadImage(currentTab, file);
      if (uploaded) imageUrl = uploaded;
      else if (!imageUrl) imageUrl = imagePreviewImg.src; // offline mode: keep data-URL preview
    }

    const isContact = COLLECTIONS[currentTab].isContact;
    const data = {
      name: fName.value.trim(),
      link: fLink.value.trim(),
      order: parseInt(fOrder.value, 10) || 1,
      status: fStatus.value,
      image: imageUrl || "",
    };
    if (isContact) {
      const value = fDescription.value.trim();
      const type = fContactType.value;
      data.value = value;
      data.type = type;
      if (type === "whatsapp") {
        const digits = value.replace(/[^0-9]/g, "");
        data.link = `https://wa.me/${digits}`;
      } else if (type === "telegram") {
        const handle = value.replace(/^@/, "").trim();
        data.link = `https://t.me/${handle}`;
      } else if (type === "email") {
        data.link = `mailto:${value}`;
      } else {
        data.link = fLink.value.trim(); // website: full URL, entered manually
      }
    } else {
      data.description = fDescription.value.trim();
      data.memberCount = fMemberCount.value.trim();
    }

    await saveItem(currentTab, data, editingId);
    toast(editingId ? "Item updated." : "Item added.");
    closeModal();
    renderTab(currentTab);
  } catch (err) {
    console.error(err);
    modalError.textContent = "Something went wrong saving this item. Please try again.";
  } finally {
    saveBtn.disabled = false; saveBtn.textContent = "Save Item";
  }
});

/* ---------- Boot ---------- */
async function initApp() {
  const fb = await initFirebase();
  auth = fb.auth;
  db = fb.db;
  firebaseReady = fb.firebaseReady;
  initAuth();
}
initApp();
