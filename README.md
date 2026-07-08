# QAMAR

Sumaya's 75-day growth cycle — Deen, career, health, content, and self-care,
moving like the moon in eleven quiet phases.

A real Vite + React project. No CDNs, no in-browser compiling — everything is
built ahead of time into fast static files.

## Project structure

```
qamar/
├── index.html          entry point Vite uses to boot the app
├── vite.config.js       build config — base path must match your repo name
├── package.json         dependencies + scripts
├── src/
│   ├── main.jsx          mounts <App /> into the page
│   ├── App.jsx           the whole app — all screens, all logic
│   ├── storage.js        localStorage persistence layer
│   └── index.css         base styles + small utility classes
└── .github/workflows/
    └── deploy.yml        auto-deploys to GitHub Pages on every push to main
```

## Running it locally

You'll need [Node.js](https://nodejs.org) installed (v18 or newer).

```bash
npm install       # installs React, Vite, lucide-react, etc.
npm run dev       # starts a local dev server, usually at http://localhost:5173
```

Changes you make to files in `src/` show up instantly in the browser — no
manual refresh needed.

## Building for production

```bash
npm run build     # outputs optimized static files into dist/
npm run preview   # serve that dist/ build locally, to sanity-check it
```

## Deploying to GitHub Pages

**Before your first deploy:** open `vite.config.js` and make sure the `base`
value matches your actual GitHub repo name exactly, e.g. if your repo is
`github.com/yourname/qamar`, it should say `base: "/qamar/"`.

This project auto-deploys via GitHub Actions — the workflow in
`.github/workflows/deploy.yml` builds and publishes automatically every time
you push to `main`.

**One-time setup on GitHub:**
1. Push this whole folder to a new GitHub repo
2. Go to the repo's **Settings → Pages**
3. Under "Build and deployment," set **Source** to **GitHub Actions**
4. Push again (or just wait) — the workflow runs and your site goes live at
   `https://yourusername.github.io/qamar/`

Every future `git push` to `main` redeploys automatically. No manual build
step, no `npm run deploy` needed unless you want to.

## Data & persistence

Everything — your niyyahs, checkboxes, journal entries, start date — is
stored in your browser's `localStorage`, via `src/storage.js`. That means:

- Your data lives on **this specific browser, on this specific device**
- Clearing your browser's site data will erase your QAMAR progress
- Different devices (phone vs. laptop) each keep their own separate copy
- Use the **Export** option in Settings regularly to back up your journal as
  a text file — that's your safety net

## Making changes later

This is a normal React project now. To change anything — add a section,
tweak a color, adjust a rotation — edit `src/App.jsx` directly, check it in
`npm run dev`, then push to `main` when you're happy. GitHub handles the rest.
