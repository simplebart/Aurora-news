# Aurora — Personal News Hub

A fast, magazine-style RSS reader. Works on desktop and mobile. No server needed.

## Deploy in 3 steps

### 1. Push to GitHub
Create a new GitHub repo and push all these files.

### 2. Deploy on Vercel (free)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** → import your repo
3. Vercel detects Vite automatically — click **Deploy**
4. Done. Your app is live at `https://yourproject.vercel.app`

### 3. Save feeds permanently (optional but recommended)
Without this, feeds are saved in browser localStorage only.

1. Go to [gist.github.com](https://gist.github.com)
2. Create a **Secret Gist** with filename `aurora_feeds.json` and content `{}`
3. Copy the Gist ID from the URL
4. Create a GitHub token at [github.com/settings/tokens](https://github.com/settings/tokens) — only needs **gist** scope
5. In the Aurora app, open **Settings** (gear icon in sidebar) and enter your Gist ID and token

## Run locally
```bash
npm install
npm run dev
```

## Features
- Magazine layout on desktop, Google News layout on mobile
- Liquid glass nav bar
- Keyword filtering (no deals/reviews from The Verge/Wired)
- Diversity cap per section (max 2 articles per source)
- Read tracking (articles dim when opened)
- Save/star articles
- Infinite scroll
- og:image scraping for articles without images
- Light/dark mode follows system preference
- Installable as PWA (add to home screen)
