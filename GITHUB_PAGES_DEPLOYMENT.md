# NSS College Ottapalam - GitHub Pages Deployment Guide

This repository is fully configured for zero-configuration, seamless deployment to **GitHub Pages** with **anti-blank-screen protection**.

---

## 🛡️ Why You Won't Get a Blank White Screen

Most React / Vite apps suffer from a stuck blank white screen on GitHub Pages because of three common pitfalls. All three have been solved in this codebase:

1. **Relative Asset Path Resolution (`base: './'`)**
   - Configured in `vite.config.ts`.
   - All JS, CSS, and media files load relative to the repository URL (`./assets/...`), preventing `404 Not Found` MIME-type rejection errors on `https://<username>.github.io/<repo-name>/`.
2. **Jekyll Processing Disabled (`.nojekyll`)**
   - Added in `public/.nojekyll`.
   - Prevents GitHub's default Jekyll engine from stripping or ignoring files starting with underscores.
3. **Single-Page-Application (SPA) Route Preservation (`public/404.html`)**
   - Handles page reloads, deep routes, and query parameters so refreshing on tabs never hits GitHub's default 404 page.
4. **Immediate Inline Preloader (`index.html`)**
   - Provides an instant visual feedback loader with college emblem and an automatic 7-second recovery button if the user has an extremely slow connection.
5. **Top-Level React Error Boundary (`src/components/common/ErrorBoundary.tsx`)**
   - Catches any unexpected client-side exceptions and displays an Institutional Recovery screen with one-click "Reload Portal" and "Clear Cache & Restart" buttons instead of crashing to a blank white screen.

---

## 🚀 How to Deploy (Step-by-Step)

### Option 1: Automatic Deployment via GitHub Actions (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment with anti-blank-screen protection"
   git push origin main
   ```

2. **Enable GitHub Actions for Pages**:
   - Go to your repository on GitHub.
   - Click on **Settings** (top right tab).
   - In the left sidebar, click **Pages** (under the "Code and automation" section).
   - Under **Build and deployment** → **Source**, select:
     👉 **GitHub Actions** (do NOT select "Deploy from a branch").

3. **That's it!**:
   - The included workflow `.github/workflows/deploy.yml` will automatically trigger, install dependencies, build the production bundle, and deploy to your live GitHub Pages URL:
     `https://<your-username>.github.io/<your-repo-name>/`
   - You can watch progress in the **Actions** tab of your repository.

---

### Option 2: Manual Build & Push (Alternative)

If you prefer building locally and pushing to a `gh-pages` branch:

1. Build the production package:
   ```bash
   npm run build
   ```
2. The output in `./dist` includes `index.html`, `404.html`, `.nojekyll`, and all assets with relative paths.
3. In GitHub repo **Settings → Pages**, set **Source** to "Deploy from a branch" and pick the `gh-pages` branch `/ (root)`.

---

## 🔑 Supabase Database Connection on GitHub Pages

The Supabase database connection works automatically on GitHub Pages. The code includes production fallbacks to the configured NSS College database:
- **Supabase URL**: `https://jpirkjbqirkwsmesusqa.supabase.co`

If you ever wish to override credentials in your GitHub Actions build:
1. In your GitHub repo, go to **Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 🛠️ Verification & Troubleshooting Checklist

| Symptom | Cause | Solution |
|---|---|---|
| **404 on initial open** | GitHub Pages source not set to GitHub Actions | Go to **Settings → Pages** and choose **Source: GitHub Actions**. |
| **Old cached assets** | Browser cached previous failed build | Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac) to hard-reload. |
| **Manual Trigger** | Want to redeploy without pushing a commit | Go to **Actions** tab → click **Deploy to GitHub Pages** → click **Run workflow**. |
