# Kino

A YouTube video viewing server. Search videos, channels, and playlists, then watch them in an embedded YouTube player.

## What it does

Kino looks up YouTube metadata on the server and plays videos with the official YouTube embed. The home page loads a popular-video feed. Search covers videos, Shorts, livestreams, channels, and playlists. The watch page shows the player, description, related videos, and the current playlist when one is open. Shorts use a vertical player. Current livestreams play in the embed with a LIVE badge, and past streams play as normal videos with a Stream badge. Channel pages have Videos, Shorts, and Live tabs, plus playlists on the Videos tab.

## Features

- Home recommendations that mix livestreams and long videos. Type topics into “Tune your feed” and Home, Shorts, and Live favor them. Interests stay in this browser, with no account. With none set, Home uses a popular-video search plus the live filter, because signed-out YouTube does not return a personal home feed.
- A Shorts button in the desktop sidebar and the mobile bottom bar. Each visit picks a new pair of signed-out searches, shuffles them, and skips Shorts already watched in this browser. Scrolling follows that Short’s reel and, when it repeats, another search. The page shell appears immediately. Each Short loops muted until you tap for sound. Comments dock to the right of the video on desktop and slide up from the bottom on a phone.
- Comments on long videos, Shorts, and past streams, with more comments and replies when YouTube returns them. Shorts open comments in a slide-up panel.
- Live chat on a current livestream, beside the player on desktop and under it on a phone, using YouTube’s live chat embed.
- Search with filters for all results, videos, Shorts, live (current streams and past streams), channels, or playlists
- Watch page with a YouTube embed, related videos, and an optional playlist sidebar
- Vertical player for Shorts, and a LIVE label when a broadcast is still live
- Channel pages with Videos, Shorts, and Live tabs, plus playlists
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

Server pages call `src/lib/youtube/client.ts`. That module keeps one Innertube session and maps results into video, channel, and playlist objects, capped at 24 items. Interests typed on Home stay in `localStorage` and go out with the home and Shorts requests. With topics set, Home searches each one for videos and livestreams in parallel, mixes in a few popular videos, and loads more from the search continuation. The Shorts feed follows YouTube’s signed-out reel: a Shorts search seeds the first video, then `getShortsVideoInfo` returns the next Shorts in that reel. Those searches rotate through the saved topics and still skip Shorts already watched in this browser. Home recommendations mix a popular-video search with the live filter, because the signed-out home browse is only a sign-in prompt. Comments use Innertube’s comments continuation, including another page and replies when a reply token is present. Live chat is YouTube’s `live_chat` embed so it keeps updating on Vercel. The watch page embeds `https://www.youtube.com/embed/<id>` with autoplay. That same embed plays a live broadcast while it is live and a normal video afterward. Shorts in the feed stay muted until a tap unmutes them, then loop. The `/api/youtube/*` routes call the same functions and rate-limit by `x-forwarded-for` or `x-real-ip`. When a lookup fails, the client returns the bundled catalog in `src/lib/youtube/demo-data.ts`.
