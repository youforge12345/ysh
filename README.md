# YouForge Social Hub

Premium black-and-gold landing page for a WhatsApp/Telegram link hub, plus a
Firebase-powered admin dashboard to manage everything without touching code.

## What's inside
- `index.html` — the public one-page site
- `admin.html` — the admin dashboard (login-gated, **not linked from the public site** — see below)
- `css/style.css` — site styles & design tokens · `css/admin.css` — dashboard styles
- `js/data.js` — demo content shown only if Firebase isn't configured yet
- `js/config.js` — **your Firebase + Cloudinary keys go here**
- `js/main.js` — loads content and drives all animation/interaction on the public site
- `js/admin.js` — auth, and CRUD for every collection + the homepage stats panel
- `manifest.json`, `sw.js`, `icons/` — installable PWA shell

### Admin panel access
There's intentionally **no "Admin" link anywhere on the public site** — the only
way in is by knowing the URL directly:
```
https://your-site.web.app/admin.html
```
Bookmark that URL for yourself. Login is still required (Firebase
Authentication), so even someone who finds the URL can't get in without your
admin email/password.

### Section Text tab
Every section's small badge text and heading (e.g. "WhatsApp Communities" /
"Communities worth joining") can be edited from the **"Section Text"** tab —
or turned off entirely per section, which hides just the heading while the
items below still show. Stored at `settings/sectionText` in Firestore.

### Section Order tab
The admin sidebar also has a **"Section Order"** tab — give each section
(WhatsApp Communities, Groups, Channels, Telegram Channels, Telegram Groups,
Contact, Website) a number, lower = shows first on the homepage. The Hero and
the stats bar always stay fixed at the very top regardless. Stored at
`settings/sectionOrder` in Firestore.

### Homepage Stats tab
The admin sidebar has a **"Homepage Stats"** tab that controls the four
counters at the top of the site (Communities / Groups / Channels / Members).
For each one you can set the number, an optional suffix (e.g. `+` or `K+`),
and toggle it on/off — turning one off hides that card and the rest resize to
fill the row. This is stored in a single Firestore document at
`settings/stats`.

### Auto-logo from link
If an item's Image field is left empty, its card automatically shows the
join link's own logo/favicon instead (via DuckDuckGo's favicon service —
works for WhatsApp, Telegram, or any website URL, shown neatly centered
rather than stretched). Upload or paste an image any time to override this
with a custom picture. Note: this is an unofficial, best-effort service —
some sites may not have a favicon to fetch, in which case a generic icon
appears until a real image is uploaded.

### Website section
**Website** is its own collection in the admin sidebar — separate from
Contacts — with the same fields as the other content types (image, name,
description, join link, order, status). Add at least one active entry and
both the **"Website" nav link** and its **on-page section** (image cards,
just like Communities/Groups/Channels) appear automatically. Leave it empty
and both stay fully hidden — nothing shows, not even the heading.

### Empty sections stay fully hidden
Any section with zero active items — Communities, Groups, Channels, Telegram,
Contact, or Website — hides completely (heading included), not just the
cards inside it. Add at least one active item to a collection for its
section to reappear.

Open `index.html` directly — it works out of the box with placeholder demo
content only when Firebase isn't configured. Once Firebase is connected,
every section shows exactly what's in Firestore — nothing else — so an empty
collection means an empty (but graceful) section, not fake placeholder cards.

## Connect Firebase (to make content live and editable)
1. Create a project at https://console.firebase.google.com
2. Enable **Authentication → Email/Password**, and add yourself as a user.
3. Enable **Firestore Database** (start in production mode).
4. In Project settings → Your apps, create a Web app and copy the config object.
5. Paste those values into `js/config.js`, replacing the `YOUR_...` placeholders.
6. Reload `admin.html`, sign in, and start adding content — the public site
   reads live from these six Firestore collections:
   `whatsapp_communities`, `whatsapp_groups`, `whatsapp_channels`,
   `telegram_channels`, `telegram_groups`, `contacts`.

> Firebase Storage is **not** used in this project — images go through
> Cloudinary instead (see below). You only need Auth + Firestore from Firebase.

Each item stores: image (Cloudinary URL or a pasted URL), name, description,
member count, join link, display order, and status (active/inactive). Only
active items appear on the site, sorted by order.

### Suggested Firestore security rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Connect Cloudinary (for images — required)
This project uses Cloudinary for every image upload in the admin panel.

1. Create a free account at https://cloudinary.com
2. In **Settings → Upload**, scroll to *Upload presets* → **Add upload preset**
   → set **Signing Mode** to **Unsigned** → save, and copy its name.
3. Copy your **Cloud name** from the Cloudinary dashboard home page.
4. Paste both into `js/config.js` under `cloudinaryConfig`.

Until Cloudinary is configured, the admin panel's file upload is disabled and
you can paste an image URL instead — nothing breaks either way.

Until Firebase is configured, `admin.html` still opens in an **offline demo
mode** so you can explore the dashboard UI — changes there aren't persisted.

## Auto-deploy from GitHub (optional)
This project includes GitHub Actions workflows (`.github/workflows/`) that
deploy to Firebase Hosting automatically whenever you push to `main` — no
need to run `firebase deploy` by hand again.

### Easiest setup (recommended)
1. Push this project to a GitHub repository (create one on github.com if you
   don't have it yet, then `git init`, `git add .`, `git commit -m "init"`,
   `git remote add origin <your-repo-url>`, `git push -u origin main`).
2. In the project folder, run:
   ```bash
   firebase init hosting:github
   ```
3. It'll ask you to log into GitHub and pick this repository — say **yes**
   to "Set up automatic builds and deploys with GitHub?" and pick `main` as
   the branch. This automatically creates the required secret for you.
4. Done — every push to `main` now deploys automatically. Check progress
   under your repo's **Actions** tab on GitHub.

### Manual setup (if you'd rather not use the CLI)
1. Firebase Console → your project → ⚙️ **Project settings** → **Service
   accounts** → **Generate new private key** (downloads a `.json` file).
2. On GitHub: your repo → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**.
   - Name: `FIREBASE_SERVICE_ACCOUNT_YOUFORGE_S_HUB`
   - Value: paste the entire contents of that `.json` file
3. Push to `main` — the included workflow files pick it up automatically.

## Deploying (manual)

**Important — do this once:** this project includes `firebase.json` with
caching rules that stop Firebase Hosting from serving stale HTML/JS/CSS to
returning visitors after you deploy an update. Without this, browsers can
keep showing an old cached version for a while after every deploy, making it
look like your changes didn't take effect.

If you already ran `firebase init hosting` before and have your own
`firebase.json`, replace it with the one in this folder (or copy its
`"headers"` array into yours) before your next deploy.

Any static host works (Firebase Hosting, Netlify, Vercel, GitHub Pages). No
build step is required — it's plain HTML/CSS/JS with ES modules loaded from
the Firebase CDN.

After deploying this specific update, do **one** hard refresh (Ctrl+Shift+R)
to clear out anything cached from before this fix — after that, plain
deploys should always show up immediately.
"# ysh" 
