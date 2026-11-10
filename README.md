# Sundays Left

**Your whole life on one page, one dot per week.**

Enter your birthday and see every week you've lived and every week you (statistically) have left: 52 dots a row, one row per year, coloured by stage of life. It's a quiet nudge to make this Sunday count.

**▶ Live: https://USERNAME.github.io/sundays-left/**

## Features

- **Your life in weeks:** lived weeks fill in, and the current week is outlined.
- **Mark the weeks that matter:** graduations, moves, birthdays, plans. Click any week on the chart or type a date, then add a label and colour.
- **Make it yours:** your own title, circle / rounded / square cells, and custom colours for each life stage.
- **Zoom:** buttons, `+` / `-` keys, Ctrl + scroll, and fit modes for the page width or the whole chart.
- **Print & save:** a clean poster for printing, or a high-resolution PNG.
- **Private by design:** everything stays in your browser's local storage. No accounts, no server.

## Development

Requires Node 14+. On Node 17 or newer, webpack 4 needs the legacy OpenSSL provider.

```bash
# install (skipping native build scripts that modern Node can't compile)
npm ci --ignore-scripts

# dev server with hot reload at http://localhost:3000
NODE_OPTIONS=--openssl-legacy-provider npm run dev

# lint + tests
npm run lint
npm test

# static build into dist/
NODE_OPTIONS=--openssl-legacy-provider npm run generate
```

On Windows PowerShell, set the variable first: `$env:NODE_OPTIONS="--openssl-legacy-provider"`.

## Deployment

Every push to `master` is linted, tested, built and published to GitHub Pages by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The site's base path comes from the repository name automatically.

## Credits

- Inspired by Kurzgesagt's [Calendar of Your Life](https://shop-us.kurzgesagt.org/collections/existential-dread/products/lifespan-calendar-poster) poster. If you like the idea, consider supporting them on [Patreon](https://kurzgesagt.org/patreon-2/).
- Built on top of [Abbondanzo/calendar-of-your-life](https://github.com/Abbondanzo/calendar-of-your-life) by Peter Abbondanzo.
