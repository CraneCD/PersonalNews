# El Brief

A personal news desk: one edition a day, at 08:00 America/Bogotá, covering the
previous ~24 hours in three ranked sections — Medellín & Antioquia, Colombia, and
the world. Ten items each, ordered by consequence rather than recency.

## Reading it

The current edition is published as a private page at
<https://claude.ai/code/artifact/0ce40990-d3dc-4079-b96f-acab393769a3> — the daily
run redeploys that same URL, so the link never changes.

To read it from the repo instead, open `index.html`. No build step, no dependencies, no server required — the page
works straight off the filesystem as well as from any static host (GitHub Pages,
Netlify, S3). Editions are picked from the dropdown; the theme button flips
light/dark, and the page follows the OS setting by default.

## How an edition is stored

Each day is one self-registering script:

```
data/
  manifest.js          # every published date, newest first
  briefs/
    2026-07-29.js      # window.NewsDesk.register({ ... })
```

A brief looks like this:

```js
window.NewsDesk.register({
  date: "2026-07-29",
  weekday: "Miércoles",
  timezone: "America/Bogota",
  generatedAt: "2026-07-29T08:00:00-05:00",
  window: "Últimas ~24 horas",
  topOfDay: ["…", "…", "…"],
  sections: [
    {
      id: "medellin",
      label: "Local",
      title: "Medellín & Antioquia",
      accent: "verde",            // verde | amarillo | azul
      items: [
        { headline: "…", summary: "…", source: "El Colombiano", url: "https://…" }
      ]
    }
  ],
  caveats: ["…"]                  // sourcing limitations worth flagging
});
```

Scripts register themselves on load rather than being fetched as JSON, which is
what keeps `file://` working — `fetch()` of a local file is blocked by CORS, a
`<script>` tag is not.

## Adding an edition

1. Write `data/briefs/<YYYY-MM-DD>.js` in the shape above.
2. Prepend `{ date: "<YYYY-MM-DD>", weekday: "…" }` to `data/manifest.js`.
3. Commit.

The dropdown, deep links (`index.html#2026-07-29`), and the archive all key off
the manifest, so that is the only index to keep in sync.

## The daily run

`prompts/daily-brief.md` holds the standing editor instruction — ranking rules,
exclusions, the source list, and the publishing steps. It is versioned alongside
the site so the prompt and the output never drift apart.

The schedule itself is a Claude Code Routine firing at 13:00 UTC (08:00 COT, UTC-5;
Colombia does not observe daylight saving, so the UTC hour is stable year-round).
Each firing starts a fresh session, researches the last 24 hours, writes the new
edition, pushes it, and redeploys the published page.

### Sourcing constraint

The session's egress policy blocks direct HTTPS to news domains — `WebFetch` and
`curl` both get a 403 from the proxy on CONNECT. Editions are therefore compiled
from web-search results, which means individual articles are not opened and
re-read before publication. That limitation belongs in each edition's `caveats`
array rather than going unmentioned.

## Layout

```
index.html          page shell
assets/style.css    editorial theme, light + dark, print styles
assets/app.js       manifest → edition loader → renderer
data/               manifest and one file per edition
prompts/            the standing editor prompt
```
