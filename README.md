# FoodTrack

A personal restaurant review journal built with React + Vite.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173/FoodTrack/ in your browser.

## Deploying to GitHub Pages

```bash
npm run deploy
```

This builds the project and publishes the `dist/` folder to the `gh-pages` branch.
Make sure your repository is named `FoodTrack` and GitHub Pages is configured to serve from `gh-pages`.

## Connecting Supabase

1. Copy `.env.example` to `.env` and fill in your project URL and anon key.
2. In `src/services/reviewService.js`, replace each localStorage function body with the Supabase call shown in the comment above it.
3. Remove the localStorage helper functions (`load` / `save`) at the top of that file.
