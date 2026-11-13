# Lakeville PTA – Events App planning portal

A private, shared planning questionnaire for Lakeville PTA (Jessie, Jimmy) and DBY. It covers six sections of questions, saved shared answers, files attached to any answer (JPG, PNG, PDF, Excel), Previous/Next paging, an owner-only "Pro tier planning" page (OWNER_EMAILS), a Lakeville team chat tagged by event topic (the owner can post too) alongside "Questions for DBY", team comments with replies, resolve, edit, delete and attachments, a "Comment on intro" anchor on every page, and an illustrative app preview.

It runs as **one Cloudflare Worker** with a D1 database. There is no framework, no npm install and no build server.

## How it is deployed

- Cloudflare **Workers Builds** is connected to this repo. Every push to `main` runs `npx wrangler deploy`, and the site updates in about a minute.
- **Sign-in** uses Cloudflare Access (an email one-time code) on the workers.dev URL. The Worker also verifies the Access token itself (`ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` in `wrangler.jsonc`).
- **Who can get in:** you choose this in the Cloudflare Zero Trust dashboard → Access → Applications → the Worker's app → Policies → add email addresses.
- **Database tables** are created automatically on the first request. There are no migrations to run.
- **Attachments** need an optional R2 bucket (see `wrangler.jsonc`). Without it, the attach button is hidden.

## How to change something (for any person or AI)

1. Edit the files in `src/`:
   - `model.js`: all questions, sections and feature list (shared by the server and the page)
   - `client.js`: the page's behaviour (vanilla JS, no framework)
   - `styles.css`: the look
   - `server.js`: the API, database and sign-in check
   - `page.html`: the page shell
   - `preview.html`: the illustrative app preview
2. Run `node build.mjs`. This regenerates `worker.js`, the single file Cloudflare runs. **Always commit `worker.js` together with your `src/` changes.**
3. Test locally (Node 22.5+ and Python Playwright with Chrome):
   ```
   node test/harness.mjs &          # local stand-in for Cloudflare (SQLite + fake sign-in)
   node test/api-test.mjs           # API checks
   python3 test/ui-test.py          # two-person browser checks (restart harness first for clean data)
   python3 test/flag-ui-test.py     # "beyond Essentials" flag flow (restart harness first)
   python3 test/suggest-ui-test.py  # AI-suggested flags: owner-only until approved (restart harness first)
   ```
4. Push to `main`. Cloudflare deploys it.

**No-GitHub fallback:** open Cloudflare → Workers & Pages → lakeville-planning → Edit code, paste the contents of `worker.js`, and click Deploy. If you do this, also commit the change here, or the next push will overwrite it.

## Data

Answers, comments and names live in the D1 database (`lakeville-planning`), not in this repo. Use **Export answers** on the page to download a JSON copy.

## History

The portal was first built on ChatGPT Sites (Nov 2026). It was rebuilt here as a standalone Worker so it can be updated by any tool at any time.

- `test/decisions-test.py`: Decisions — DBY answers with a clean one-screen preview, Lakeville gets a banner/badge, asks, approves; editing an answer sends it back for approval.
- `test/label-test.py`: names inside answer boxes.
