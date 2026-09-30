# stephanemorera.com

One static page. No build step, no framework, no dependencies. Edit `index.html`, `styles.css`, `main.js`, push, done.

## Files

- `index.html`: all copy, the Person schema, the ledger data (`data-named` on each row, `data-count` on the tallies).
- `styles.css`: tokens at the top (`:root`), then sections in page order.
- `main.js`: the WebGL backdrop (studio wall, moving light, grain), the load reveal, the ledger dot fill and tally count.
- `assets/`: portrait (`.jpg` for schema and OG, `.webp` for the page), `crown.svg` favicon, `og.jpg` share image.
- `og.html`: the template the share image was captured from at 1200x630. Recapture after any hero copy change.
- `CNAME`, `robots.txt`, `sitemap.xml`: hosting and crawl files.

## Update the receipts

Each ledger row is `<div class="row" data-named="N" data-total="10">`. Change `data-named` (and `data-total` for the 3-run rows), update the `aria-label` on the `.dots` span, and the tallies `<b data-count="...">`. Keep the date, window and method sentence in `.receipts-head` in sync with the run they describe.

## Preview locally

```
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/.

## Deploy: GitHub Pages (free, no build, survives a laptop change)

```
gh repo create stephanemorera88-spec/stephanemorera.com --public --source=. --push
gh api -X POST repos/stephanemorera88-spec/stephanemorera.com/pages -f "source[branch]=main" -f "source[path]=/"
gh api -X PUT repos/stephanemorera88-spec/stephanemorera.com/pages -f cname=stephanemorera.com -F https_enforced=true
```

Then in GoDaddy DNS for stephanemorera.com (values from GitHub's custom-domain documentation):

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | stephanemorera88-spec.github.io |

Delete the GoDaddy Website Builder A records first (the "Launching Soon" page). HTTPS provisions within an hour of the DNS check passing in the repo's Pages settings.

## Deploy: Vercel (alternative)

```
vercel login
vercel --prod
```

Add the domain in the Vercel project and point GoDaddy at the records Vercel shows.

## After it is live

1. Google Search Console: add `stephanemorera.com` as a Domain property, submit `sitemap.xml`, request indexing on `/`.
2. Bing Webmaster Tools: same.
3. Add `https://stephanemorera.com/` to the `sameAs` list of the Person schema on evoix.io (`src/lib/schema.ts`, `founderSchema`) and link it from the evoix.io about page.
