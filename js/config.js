/* =====================================================
   FIREBASE CONFIGURATION
   Paste your project's config below. Get it from:
   Firebase Console → Project settings → Your apps → SDK setup and configuration
   Used for Firestore (data) and Authentication (admin login) only —
   images go through Cloudinary below, not Firebase Storage.
   Until this is filled in, the site runs entirely on the
   demo data in js/data.js — nothing breaks.
===================================================== */
export const firebaseConfig = {
  apiKey: "AIzaSyBfUBIiiy7emkp8J1rhoTj4dL5Os5-BwWs",
  authDomain: "youforge-s-hub.firebaseapp.com",
  projectId: "youforge-s-hub",
  storageBucket: "youforge-s-hub.firebasestorage.app",
  messagingSenderId: "357836944572",
  appId: "1:357836944572:web:6805a2fc95a3702bf04cb9",
  measurementId: "G-0ZG602374F"
};

/* =====================================================
   CLOUDINARY CONFIGURATION — used for ALL image uploads
   Firebase Storage is intentionally not used in this project.
   Get these from: Cloudinary Console → Settings → Upload
   → create an "Unsigned" upload preset.
   If left as placeholders, the admin panel falls back to a
   pasted image URL field instead of a file upload.
===================================================== */
export const cloudinaryConfig = {
  cloudName: "sz845sfs",
  uploadPreset: "youforgeshub"
};

export const cloudinaryReady = !Object.values(cloudinaryConfig).some(v => String(v).startsWith("YOUR_"));

const isConfigured = !Object.values(firebaseConfig).some(v => String(v).startsWith("YOUR_"));

export let app = null;
export let db = null;
export let auth = null;
export let firebaseReady = false;
export let authReady = false;
export let firebaseInitError = null;

if (isConfigured) {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    app = initializeApp(firebaseConfig);
  } catch (err) {
    firebaseInitError = `App init failed: ${err && err.message ? err.message : err}`;
    console.warn("[YouForge] Firebase app failed to initialize.", err);
  }

  if (app) {
    // Firestore and Auth are initialized independently — a failure in one
    // (e.g. Auth needing IndexedDB, which some browsers restrict) must not
    // take down the other. The public site only needs Firestore to work.
    try {
      const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      db = getFirestore(app);
      firebaseReady = true;
      console.info("[YouForge] Firestore connected — live data will be used.");
    } catch (err) {
      firebaseInitError = `Firestore init failed: ${err && err.message ? err.message : err}`;
      console.warn("[YouForge] Firestore failed to initialize, falling back to demo data.", err);
      firebaseReady = false;
    }

    try {
      const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      auth = getAuth(app);
      authReady = true;
    } catch (err) {
      console.warn("[YouForge] Firebase Auth failed to initialize (admin login may not work here).", err);
      authReady = false;
    }
  }
} else {
  console.info("[YouForge] Firebase config not set — showing demo data. Edit js/config.js to go live.");
}

if (cloudinaryReady) {
  console.info("[YouForge] Cloudinary connected — admin image uploads will use Cloudinary.");
} else {
  console.info("[YouForge] Cloudinary not set — paste image URLs in the admin panel until it is, or add cloudinaryConfig above.");
}
