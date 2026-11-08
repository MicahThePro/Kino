# Kino

A YouTube video viewing server. Search videos, channels, and playlists, then watch them in an embedded YouTube player.

## What it does

Kino looks up YouTube metadata on the server and plays videos with the official YouTube embed. The home page loads a popular-video feed. Search covers videos, channels, and playlists. The watch page shows the player, description, related videos, and the current playlist when one is open. Channel pages list uploads and playlists. Playlist pages list their items.

## Features

- Home feed of popular videos
- Search with filters for all results, videos, channels, or playlists
- Watch page with a YouTube embed, related videos, and an optional playlist sidebar
- Channel pages with uploads and playlists
- Playlist pages
- JSON routes under `/api/youtube` for search, videos, channels, and playlists
- Rate limit of 60 requests per minute per client IP on each API route group
- Automatic fallback to a bundled demo catalog when a YouTube lookup fails or a popular-video search comes back empty

## Tech stack

- Next.js 16 (App Router) and React 19
- TypeScript
- Tailwind CSS 4 and shadcn/ui (Radix UI, Lucide)
- [youtubei.js](https://github.com/LuanRT/YouTube.js) for server-side YouTube lookups

## Setup

Node.js 20 or newer and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3847](http://localhost:3847).

### Environment variables

The app does not read a YouTube API key or any other environment variable. Lookups go through youtubei.js (`Innertube.create({ generate_session_locally: true })`), not the Google YouTube Data API.

`.gitignore` already ignores `.env*` files. You do not need to create an env file to run Kino.

### Demo mode

There is no environment switch that forces demo mode. `getYoutubeMode()` always returns `"live"`. Each lookup tries the Innertube client first. If that call throws, or if the popular-video search returns no videos, the same function returns bundled sample data and `mode: "demo"`. The page then shows a banner: “Browsing backup catalog”, or “Showing backup results after a YouTube lookup hiccup” when the lookup threw. Embeds still use `https://www.youtube.com/embed/<id>`. Playlist ids that start with `PLDemo` are demo-only and are left off the embed URL.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3847 |
| `npm run build` | Production build |
| `npm run start` | Production server on port 3847 |
| `npm run lint` | ESLint |

## Project structure

```
src/app/                 home, search, watch, channel, and playlist pages
src/app/api/youtube/     JSON routes for search, videos, channels, and playlists
src/components/          header, search, cards, player embed, mode banner
src/components/ui/       shadcn/ui primitives
src/lib/youtube/         Innertube client, result mappers, demo catalog, formatting, rate limit
public/                  static SVG assets
```

## How it works

Server pages call `src/lib/youtube/client.ts`. That module keeps one Innertube session and maps results into video, channel, and playlist objects, capped at 24 items. The watch page embeds `https://www.youtube.com/embed/<id>` with autoplay. The `/api/youtube/*` routes call the same functions and rate-limit by `x-forwarded-for` or `x-real-ip`. When a lookup fails, the client returns the bundled catalog in `src/lib/youtube/demo-data.ts` so the page still has something to show.
