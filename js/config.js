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

/* -----------------------------------------------------
   initFirebase() — deliberately NOT using top-level await.
   Some browser/network combinations handle "top-level await +
   dynamic import" unreliably, silently leaving importers with
   stale values. Using a plain async function that callers
   explicitly await sidesteps that entire class of bug — it's
   the most universally-supported pattern there is.
   Memoized so every caller (main.js, admin.js) shares one init.
------------------------------------------------------ */
let cachedInit = null;

export function initFirebase() {
  if (cachedInit) return cachedInit;
  cachedInit = (async () => {
    const result = {
      app: null, db: null, auth: null,
      firebaseReady: false, authReady: false,
      firebaseInitError: null,
    };

    if (!isConfigured) {
      result.firebaseInitError = "Firebase config in js/config.js still has placeholder values.";
      console.info("[YouForge] " + result.firebaseInitError + " Showing demo data.");
      return result;
    }

    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      result.app = initializeApp(firebaseConfig);
    } catch (err) {
      result.firebaseInitError = `App init failed: ${err && err.message ? err.message : err}`;
      console.warn("[YouForge] Firebase app failed to initialize.", err);
      return result;
    }

    // Firestore and Auth are initialized independently — a failure in one
    // (e.g. Auth needing IndexedDB, which some browsers restrict) must not
    // take down the other. The public site only needs Firestore to work.
    try {
      const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      result.db = getFirestore(result.app);
      result.firebaseReady = true;
      console.info("[YouForge] Firestore connected — live data will be used.");
    } catch (err) {
      result.firebaseInitError = `Firestore init failed: ${err && err.message ? err.message : err}`;
      console.warn("[YouForge] Firestore failed to initialize, falling back to demo data.", err);
    }

    try {
      const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      result.auth = getAuth(result.app);
      result.authReady = true;
    } catch (err) {
      console.warn("[YouForge] Firebase Auth failed to initialize (admin login may not work here).", err);
    }

    return result;
  })();

  return cachedInit;
}

if (cloudinaryReady) {
  console.info("[YouForge] Cloudinary connected — admin image uploads will use Cloudinary.");
} else {
  console.info("[YouForge] Cloudinary not set — paste image URLs in the admin panel until it is, or add cloudinaryConfig above.");
}
