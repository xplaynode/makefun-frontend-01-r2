# Lucky Frontend — makefun-frontend-01

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/xplaynode/makefun-frontend-01-r2/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/xplaynode/makefun-frontend-01-r2/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A lean, fast, accessible alternative frontend for [make.fun](https://make.fun/bounty/makefun-frontend-01), built for the [makefun-frontend-01 bounty](https://make.fun/bounty/makefun-frontend-01).

Lucky Frontend is a static frontend with no build step. It reads only make.fun's public API (GET requests, CORS open) and loads no script, stylesheet, module, or font from any origin other than make.fun itself. It uses vanilla JavaScript ES modules, one small CSS file, a system font stack, in-memory API caching with ETag / If-None-Match revalidation, and shared promises for concurrent identical requests, so repeat views stay fast and light.

## Four surfaces

Each surface is reachable by an in-app link and by its own hash URL:

- `#/` — the live bounty board: every open bounty with its live pot (reward plus entry fees), its entry fee or "Free entry", a live countdown to its deadline, its category, sponsor, and submission count, plus text search, category filter chips, and sorting (ending soon / biggest pot / most entries).
- `#/bounty/<slug>` — a bounty's page: title, live pot, entry fee, deadline countdown, submissions, category and skills chips, the full description rendered as safe structured text, a rewards breakdown when the API provides one, and links to its leaderboard and to the bounty on make.fun.
- `#/bounty/<slug>/leaderboard` — that bounty's leaderboard: rank, entrant (linked to their profile), score or win rate, and stage, with paid places highlighted and a note when placements are held / provisional.
- `#/u/<handle>` — an account's public profile: avatar (with a letter fallback), display name, handle, bio, joined date and public stats, rankings, and recent entries when the API returns them.

Every surface renders defensively against the live API's real shapes (for example, a category may arrive as a plain string, an array, or null), and every view has loading, error-with-retry, and empty states. The layout is responsive (single column under 640px), keyboard accessible with semantic landmarks, a skip link, visible focus styles, and tap targets of at least 40px.

## Run it locally

Serve the app with the bundled dev server (it serves `app/` on port 8091):

```
node serve.ts --port 8091
```

Then open http://localhost:8091 in a desktop browser. Any static HTTP server with `app/` at its root works the same way.

## Hand it in (grader entry)

The entry program at the repository root copies `app/` and `screenshots/` to the output directory and writes `dossier.json` there using the vendored `buildDossier` library (`vendor/makefun-frontend.ts`, byte-identical to the kit's copy):

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Outside the grader, `MAKEFUN_OUTPUT_DIR` stands in for the default output directory `/output`. The program creates the output directory if it is missing and never deletes the directory itself.

## Screenshots

`screenshots/` holds three JPEG screenshots of the running app on live make.fun data, named in `shots.json`: `1-board.jpg` (the board, `#/`), `2-bounty.jpg` (a bounty page, `#/bounty/makefun-frontend-01`), and `3-leaderboard.jpg` (its leaderboard, `#/bounty/makefun-frontend-01/leaderboard`), each at a 1280x800 viewport.

## License

MIT — see `LICENSE`.
