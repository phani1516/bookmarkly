<div align="center">

# 🔖 Bookmarkly

**A mobile-first, offline-capable bookmark & notes manager with real-time cloud sync.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-bookmarkly--tawny.vercel.app-6C5CE7?style=for-the-badge&logo=vercel&logoColor=white)](https://bookmarkly-tawny.vercel.app/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_+_DB_+_Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

*Save links. Capture notes. Sync everywhere. Works offline.*

</div>

---

## ✨ Overview

Bookmarkly is a single-page web app that reimagines the humble browser bookmark as a **local-first, cloud-synced knowledge base**. It's a **Progressive Web App** — install it to the home screen on iOS, Android, or any desktop OS and it runs as a standalone app with no browser chrome. Everything is stored on-device by default, so the app stays fully usable through internet outages; the moment connectivity returns, changes sync automatically to Supabase across every device you've signed into.

The app organizes content across five first-class surfaces — **Home, Web, Videos, Docs, and Notes** — with sub-categorization (YouTube / Instagram / AI / Other), drag-and-drop reordering, pinning, a WYSIWYG note editor, full-text search across every tab, and a public Community feed for sharing interesting links.

Under the hood it's a custom **publish–subscribe store**, a **localStorage-first persistence layer**, and a merge-sync engine that uses last-writer-wins reconciliation based on `updated_at` timestamps — all without a state-management library.

> ⚡ **About this build:** Bookmarkly is my first "vibe-coded" project — built in tight collaboration with an AI coding assistant. I designed the data model, architecture, sync strategy, and UX; the assistant accelerated implementation. Every file was reviewed, reasoned about, and refined. Shipping something of this scope as a solo dev in a short window is exactly what modern AI-augmented engineering looks like.

---

## 🖥️ Live Demo

👉 **[bookmarkly-tawny.vercel.app](https://bookmarkly-tawny.vercel.app/)**

Deployed on **Vercel** with a **Supabase** backend (Postgres + Auth + Storage). Try it anonymously — everything works offline in `localStorage`. Sign in with Google or email to sync across devices.

---

## 📲 Built as a Real App, Not Just a Website

One of the core intentions behind Bookmarkly was that it shouldn't *feel* like a website — it should feel like an **app you actually use**. Two design decisions make that real:

### 1. Installable across every platform — as a true PWA

Bookmarkly is a **Progressive Web App**, which means it can be added to the home screen on **iOS, Android, and any desktop OS** and launched like any native app — its own icon, its own window, no browser chrome, no URL bar.

- On **iOS**: *Share → Add to Home Screen*
- On **Android**: *Menu → Install app / Add to Home Screen*
- On **desktop** (Chrome/Edge/Brave): a one-click install prompt in the address bar

Once installed, it behaves exactly like a native app: full-screen, dedicated task-switcher entry, iOS status-bar theming, Android splash screen, safe-area handling around notches and home indicators. The tech underneath is just HTML — the experience is indistinguishable from something downloaded from an app store. **Write once, install anywhere, zero app-store friction.**

### 2. Offline resilience that survives real-world internet outages

The app is **offline-first by design**, not as a nice-to-have but as a deliberate reliability guarantee. Here's what that actually means in practice:

- 🚇 **Lose Wi-Fi mid-subway-ride?** Keep saving links. Keep editing notes. Keep reorganizing categories. The UI doesn't care that the network is gone — every read and write hits local storage synchronously.
- ✍️ **Create something while offline?** It lives safely in on-device storage with its own client-generated UUID, waiting to be pushed.
- 📶 **Come back online?** The moment the Supabase client regains connectivity, the sync engine fires automatically — pushing everything that was created offline to the cloud and pulling any changes made on other devices. No lost work. No manual "retry" button. No conflicts, because client-generated UUIDs and `updated_at` timestamps let the merge resolve cleanly.

This is the same pattern that apps like Notion, Linear, and Things use — and it's the reason Bookmarkly feels responsive even on flaky connections. **Your data belongs to the moment, not the network.**

---

## 🎯 Feature Highlights

### Core
- 📲 **Installable PWA** — add to home screen on **iOS, Android, or desktop** and it launches as a standalone app, fullscreen, no browser UI — indistinguishable from a native install.
- 📱 **Mobile-first, hardware-aware UI** — safe-area insets for notches and home indicators, bottom-tab navigation, iOS status-bar theming, and a glassmorphism (CRED-inspired) visual language.
- 🌓 **Light & dark themes** — driven by CSS custom properties, toggled without a flash of wrong theme.
- 🔍 **Unified fuzzy search** — searches links, notes, URLs, and note bodies simultaneously with inline `<mark>` highlighting.
- 📌 **Pinning** — pin both categories and links to the top, with an indexed DB path for fast retrieval.
- 🎨 **Custom category colors** — 10-color preset palette per category, used as accent tint throughout the UI.
- 🔀 **Drag-and-drop reordering** — category and link ordering is position-based and persisted to the cloud.

### Content Types
- 🌐 **Web links** — paste URLs, add notes, organize into custom categories.
- 🎥 **Videos** — auto-subcategorized into **YouTube / Instagram / AI / Other**.
- 📄 **Documents** — upload files up to 500 KB to Supabase Storage with signed-URL access.
- 📝 **Notes** — a from-scratch WYSIWYG rich-text editor (bold / italic / underline / strikethrough, bulleted & numbered lists, keyboard shortcuts) built on `contentEditable` + `document.execCommand`.

### Data & Sync
- 📴 **Offline-first with automatic recovery** — every read and write hits `localStorage` instantly; if the internet drops mid-session, unsynced changes stay safely on-device and are auto-pushed the moment connectivity returns.
- ☁️ **Transparent cloud sync** — on sign-in, local-only records are pushed to Supabase and remote records are pulled and merged — no data loss.
- 📤 **CSV import / export** — full round-trip backup of categories and links, with a proper CSV parser that handles quoted cells, escaped quotes, and embedded newlines.
- 🗑️ **Soft deletes** — tombstoned rows (`is_deleted = true`) so deletions propagate cleanly to other devices.
- ❌ **Full account deletion** — a single action purges all tables, storage, and auth records.

### Community & Auth
- 🔐 **Supabase Auth** — Google OAuth + email/password with a strong-password validator (8 chars, letter + digit + symbol) and password-reset flow.
- 👥 **Community feed** — share any bookmark publicly; shows the 50 most recent posts from all users.
- 👤 **Profile management** — editable display name, synced to `auth.users` metadata and a `profiles` row.

---

## 🧱 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **UI framework** | React **19.2** (latest) | Concurrent rendering, `use()` hook, automatic batching. |
| **Language** | TypeScript **5.9** | End-to-end type safety on domain models and Supabase rows. |
| **Build tool** | Vite **7** | Near-instant HMR, ESM-native, plus the bundle-in-one-file plugin below. |
| **Styling** | Tailwind CSS **4.1** (Vite plugin) | Utility-first with native CSS variables driving the theme system. |
| **State** | **Custom pub/sub store** | Zero dependencies, ~20 LOC, teaches core reactivity. |
| **Backend-as-a-service** | **Supabase** | Postgres + Row-Level Security, OAuth, Storage, all behind one SDK. |
| **Auth** | Supabase Auth (Google + email) | OAuth redirects, session persistence, JWT refresh handled for free. |
| **Persistence** | `localStorage` + Supabase Postgres | Local-first read path, async write-through to the cloud. |
| **ID generation** | `uuid` v13 | Client-generated UUIDs allow optimistic inserts without round-trips. |
| **Bundling** | `vite-plugin-singlefile` | Ships the entire app as **one self-contained HTML file** — trivial to host anywhere. |
| **Hosting** | Vercel (frontend) + Supabase (backend) | Preview deploys per branch, edge-cached static assets. |

---

## 🏛️ Architecture

Bookmarkly is a **thin-client, fat-local** architecture: the browser owns the source of truth for the current session, and Supabase is the durable cross-device mirror.

```
┌───────────────────────────────────────────────────────────────┐
│                         React UI (19)                         │
│   HomeTab · WebTab · VideosTab · DocumentsTab · NotesTab      │
│                Community · Search · Sidebar                   │
└───────────────────────────┬───────────────────────────────────┘
                            │ useStore() / useAuth() / useTheme()
┌───────────────────────────▼───────────────────────────────────┐
│              Custom Pub/Sub Store  (src/lib/store.ts)         │
│   subscribe() · notify() · getLinks/Categories/Notes()        │
│     optimistic mutations · sync status · CSV import/export    │
└───────────┬────────────────────────────────────┬──────────────┘
            │ reads/writes                       │ async push
            ▼                                    ▼
  ┌─────────────────────┐              ┌──────────────────────┐
  │   localStorage      │              │  Supabase (cloud)    │
  │   bookmarkly_links  │              │  • Postgres tables   │
  │   bookmarkly_cats   │◀──pull+merge─│  • Auth (OAuth/Email)│
  │   bookmarkly_notes  │              │  • Storage (500KB)   │
  │   bookmarkly_theme  │              │  • RLS per user_id   │
  └─────────────────────┘              └──────────────────────┘
```

### Key design decisions

**1. Local-first, cloud-mirrored**
Every read is synchronous from `localStorage` — the UI never waits on the network. Mutations are applied locally, the listener pool is notified, and Supabase is written to in the background. Network failures never block the user.

**2. Custom pub/sub instead of Redux/Zustand**
The store exposes a 20-line `subscribe(fn)` / `notify()` pattern. `useStore()` is a tiny hook that snapshots state on every `notify()`. No middleware, no providers, no boilerplate — and every React component stays a pure consumer.

**3. Merge-sync on sign-in**
When a user signs in, `pullFromCloud()` fetches remote `categories`, `links`, and `notes` in parallel, then:
- Pushes any **local-only** rows (new data created while signed out) to Supabase.
- Overwrites local storage with the merged remote + local-only set.
- Uses `updated_at` timestamps for last-writer-wins on conflicts.

**4. Soft deletes with tombstones**
Nothing is ever hard-deleted client-side. Each row has an `is_deleted` flag, so deletions propagate to other devices on the next pull. Reads filter tombstones out transparently.

**5. Single-file bundle**
`vite-plugin-singlefile` inlines all JS/CSS/assets into a single `index.html`. The entire production build is one file that can be hosted on a $0 CDN, an S3 bucket, or even dropped into a GitHub Gist.

---

## 🗄️ Data Model

```ts
type LinkType    = 'Web' | 'Video' | 'Document';
type LinkSubtype = 'YouTube' | 'Instagram' | 'AI' | 'Other' | 'None';

interface Category {
  id: string;           // client-generated UUID
  name: string;
  type: LinkType;
  subtype: LinkSubtype;
  color?: string;       // hex from the 10-color preset palette
  position: number;     // drag-sorted order
  is_pinned: boolean;
  created_at: string;   // ISO
  updated_at: string;   // ISO — drives last-writer-wins
  is_deleted: boolean;  // tombstone
  user_id?: string;
}

interface Link {
  id: string;
  url: string;
  name: string;
  type: LinkType;
  subtype: LinkSubtype;
  category_id: string | null;
  position: number;
  is_pinned: boolean;
  file_name?: string;
  file_url?: string;    // Supabase Storage public URL (for Documents)
  notes?: string;       // per-link annotation
  /* …timestamps, tombstone, user_id… */
}

interface Note {
  id: string;
  title: string;
  body: string;         // sanitized HTML from the WYSIWYG editor
  /* …timestamps, tombstone, user_id… */
}

interface CommunityPost {
  id: string;
  url: string;
  note: string;
  author_name: string;
  user_id: string;
  created_at: string;
}
```

**Supabase tables** mirror these types and use **Row-Level Security** to scope every query to `auth.uid() = user_id`. Indexes exist on `is_pinned` (partial, `WHERE is_pinned = TRUE`) for hot-path retrieval.

---

## 📁 Project Structure

```
bookmarkly/
├── src/
│   ├── App.tsx                    # Root component, tab routing, modals
│   ├── main.tsx                   # Entry + runtime-injected favicon
│   ├── index.css                  # Theme tokens + utility classes
│   ├── components/
│   │   ├── HomeTab.tsx            # Unified feed (all content types)
│   │   ├── WebTab.tsx             # Web-link management
│   │   ├── VideosTab.tsx          # Video subtabs (YT / IG / AI / Other)
│   │   ├── DocumentsTab.tsx       # File uploads to Supabase Storage
│   │   ├── NotesTab.tsx           # WYSIWYG rich-text editor
│   │   ├── Community.tsx          # Public shared-links feed
│   │   ├── SearchResults.tsx      # Cross-tab search with highlighting
│   │   ├── Sidebar.tsx            # Auth, theme, sync, import/export
│   │   ├── DraggableCategories.tsx# Drag-sorted category chips
│   │   ├── DraggableLinkList.tsx  # Drag-sorted links within a category
│   │   ├── LinkInput.tsx          # Paste-from-clipboard URL input
│   │   ├── LinkItem.tsx           # Link card with actions
│   │   ├── AuthModal.tsx          # Sign-in / sign-up / reset flows
│   │   ├── ProfileModal.tsx       # Display-name editing
│   │   └── Icons.tsx              # All SVG icons, zero-dep
│   ├── hooks/
│   │   ├── useStore.ts            # Subscribes UI to the pub/sub store
│   │   ├── useAuth.ts             # Supabase Auth wrapper
│   │   └── useTheme.ts            # Light/dark toggle with persistence
│   ├── lib/
│   │   ├── store.ts               # State, persistence, sync engine
│   │   ├── supabase.ts            # Client configuration
│   │   └── types.ts               # Shared domain types
│   └── utils/cn.ts                # clsx + tailwind-merge helper
├── supabase/                      # Idempotent SQL migrations
├── vite.config.ts                 # React + Tailwind + single-file plugin
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A free [Supabase](https://supabase.com) project

### 1. Clone & install
```bash
git clone https://github.com/<your-username>/bookmarkly.git
cd bookmarkly
npm install
```

### 2. Configure environment
Create a `.env` file in the project root:
```bash
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Set up the database
Run the SQL migrations in `supabase/` against your Supabase project (SQL Editor → paste → Run). They create `categories`, `links`, `notes`, `profiles`, `community_posts`, the `documents` storage bucket, and the RLS policies.

### 4. Run
```bash
npm run dev      # http://localhost:5173
npm run build    # production build → dist/index.html (single file)
npm run preview  # preview the built bundle
```

### 5. Deploy
Any static host works (Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3). The production build is a single `index.html` file.

---

## 🔐 Security & Environment

Bookmarkly's backend is secured at the **database layer**, not the client. A quick note on what's committed to this repo and what isn't:

**Committed (and safe to expose):**
- The `supabase/` SQL migration files — these describe schema (tables, indexes, RLS policies) and contain no secrets.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` — these are **designed** to ship to the browser. Supabase's anon key only has the permissions your Row-Level Security policies grant to authenticated users.

**Never committed (enforced by `.gitignore`):**
- The Supabase **service role key** — bypasses RLS entirely; lives only in trusted server environments.
- Database password, JWT secret, and anything under *Settings → API* that isn't labeled `anon public`.

**How authorization actually works:**
Every table (`categories`, `links`, `notes`, `profiles`) has **Row-Level Security enabled** with policies of the form `auth.uid() = user_id`. The anon key can only read or write rows where the authenticated user matches the row owner. Even if someone opens DevTools and crafts a raw Supabase query, they can't see another user's data — the database itself enforces the boundary.

This is the canonical Supabase security model: **client-side filters are a hint, RLS is the law.**

---

## 🎓 What I Built (and Learned)

Building Bookmarkly end-to-end meant making real decisions at every layer:

- **Designed a local-first sync protocol** — not just "call the API on click", but a genuine offline-capable model with tombstones, timestamp-based conflict resolution, and a push-then-pull reconciliation path that gracefully recovers from real-world internet outages.
- **Shipped a true cross-platform PWA** — one codebase that installs as a standalone app on iOS, Android, and desktop, with home-screen icons, splash screens, status-bar theming, and safe-area handling — zero app-store overhead.
- **Implemented a state manager from scratch** — a pub/sub pattern that deliberately avoids Redux/Zustand to keep the surface area small and the model transparent.
- **Built a WYSIWYG editor without a library** — `contentEditable` + `execCommand` + IME composition handling, with keyboard shortcuts and a custom toolbar.
- **Wrote a real CSV parser** — handles quoted cells, escaped quotes (`""`), and embedded newlines (escaped as `\\n`) — no external dep.
- **Authored a theme system with CSS variables** — light/dark switching that's a single class toggle on `<html>`, no Tailwind `dark:` prefix sprawl.
- **Integrated Supabase end-to-end** — OAuth redirects, session refresh, RLS-secured queries, storage uploads with public-URL generation, and account deletion that fans out across every resource.
- **Adopted AI-assisted development deliberately** — used an AI coding assistant as a pair programmer while owning the architecture, the reviews, and the final shipped code. Understanding *why* every decision was made matters more than typing it myself.

---

## 🗺️ Roadmap

- [ ] Real-time multi-device sync (Supabase Realtime channels) instead of on-demand pull
- [ ] Service Worker + IndexedDB for true offline-first caching of remote assets
- [ ] Rich link previews (Open Graph metadata extraction via an edge function)
- [ ] Tag-based filtering in addition to categories
- [ ] Keyboard-driven power-user mode (`⌘K` command palette)
- [ ] Browser extension for one-click saving

---

## 🤝 Contributing

This is a personal learning project, but bug reports, feature ideas, and PRs are genuinely welcome. Open an issue before large changes so we can align on direction.

---

## 📄 License

MIT — feel free to fork, remix, or steal the architecture for your own projects.

---

<div align="center">

Built with ☕, React 19, Supabase, and unreasonable attention to the little details.

**[⭐ Star on GitHub](#)** · **[🌐 Live Demo](https://bookmarkly-tawny.vercel.app/)**

</div>
