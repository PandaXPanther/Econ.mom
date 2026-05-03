# The Mother of Econ

Eight purpose-built tools for AP and policy economics — at **[econ.mom](https://econ.mom)**.

> *Economia, mater omnium.*

An editorial-grade companion site to [EconLever](https://econlever.org). Built by a high-school student for AP students, NEC competitors, NSDA extempers, and anyone who'd rather *think* with economics than memorize it.

---

## The Eight Tools

| # | Tool | Path | What it does |
|---|---|---|---|
| 1 | **AP FRQ Grader** | `/#/tools/frq-grader` | Rubric-anchored FRQ scoring with point-by-point feedback |
| 2 | **TariffLab** | `/#/tools/tarifflab` | Sectoral pass-through, deadweight loss, retaliation simulator |
| 3 | **Textbook Atlas** | `/#/tools/textbook-atlas` | Live, sourced charts for every standard AP Macro graph |
| 4 | **Shock Simulator** | `/#/tools/shock-sim` | AS/AD shocks with Fed reaction functions |
| 5 | **Shadow Fed** | `/#/tools/shadow-fed` | Score your dot plot against the FOMC |
| 6 | **Econ Paper Decoder** | `/#/tools/paper-decoder` | NBER-style paper translator with method-quality flags |
| 7 | **Extemp Engine** | `/#/tools/extemp-engine` | 7-minute extemp briefs with full citation chain |
| 8 | **Colorado Econ Dashboard** | `/#/tools/colorado-econ` | 12 counties · labor, cost-of-living, education, industry |

---

## Stack

- **Frontend** Vite · React · TypeScript · Tailwind · shadcn/ui · wouter (hash routing) · Recharts · Framer Motion
- **Backend** Express (currently no API endpoints — frontend-only at the moment)
- **Type** Fraunces (display, italic) · Inter Tight (body) · JetBrains Mono (data)
- **Palette** Oxblood + parchment (light) · library-at-night + amber (dark)

## Local development

```bash
npm install
npm run dev
# → http://localhost:5000
```

## Build

```bash
npm run build
# → dist/public  (static, deployable to any CDN)
```

## Deployment — Netlify

The repo is pre-configured for Netlify via `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist/public`
- SPA redirect to `/index.html` for hash-routed deep links
- Aggressive caching on `/assets/*`, no-cache on the HTML shell
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

### Connect this repo to Netlify

1. **Netlify dashboard** → *Add new site* → *Import an existing project* → *GitHub*
2. Pick `PandaXPanther/the-mother-of-econ`
3. Netlify reads `netlify.toml`. Click **Deploy site**.
4. **Domain settings** → *Add custom domain* → `econ.mom`
5. Netlify will give you DNS records. Two options:

   **Option A — Netlify DNS (easiest)**: Update nameservers at your registrar (e.g. Namecheap, Cloudflare) to:
   ```
   dns1.p07.nsone.net
   dns2.p07.nsone.net
   dns3.p07.nsone.net
   dns4.p07.nsone.net
   ```
   *(exact set provided by Netlify in the dashboard)*

   **Option B — External DNS**: Add records at your registrar:
   ```
   A     @      75.2.60.5
   CNAME www    <site-name>.netlify.app
   ```

6. Netlify auto-provisions a Let's Encrypt SSL cert. Site goes live at `https://econ.mom`.

---

## SEO

- Per-page `<SEO />` component sets title, meta description, canonical URL, OG, Twitter cards, JSON-LD
- `Organization`, `WebSite`, `Person`, and `ItemList` structured data
- `robots.txt` + `sitemap.xml` for all 12 routes
- Hand-written 1200×630 OG image (parchment, oxblood, italic Fraunces)

## Methodology

Every tool has a documented data source and method. See `/#/methodology` on the live site.

## Author

**Saras Totey** · Bennett, Colorado · NEC finalist · NIETOC extemp · CO Chapter Pres, [Equality in Forensics](https://equalityinforensics.org)

Previous project: [EconLever](https://econlever.org)

---

© 2026 Saras Totey. All rights reserved.
