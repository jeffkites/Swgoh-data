# Hunter Wind

Map and wind histories for Lake Macquarie, Newcastle and Nelson Bay.

Page: https://jeffkites.github.io/wind/

The same export remains available at https://jeffkites.github.io/Swgoh-data/wind/.
The shorter address is served by `jeffkites/jeffkites.github.io`, using the four
static assets generated here. Keep both copies in sync when changing the map;
live readings refresh directly from the same existing Cloudflare service.

## Hosting and live data

GitHub Pages serves this directory alongside the existing SWGOH dashboard at
the repository root. All wind assets use relative paths. The map, seven
stations, history periods, spot guides and author/source credits are retained.

GitHub Pages cannot execute the original server-side station fetches. The
existing Cloudflare Worker now also serves the read-only `/api/wind` route:

https://swgoh-data.mrfaberzen.workers.dev/api/wind

The page requests it when opened, when Refresh is pressed, and every five
minutes while visible. A tab returning to the foreground checks again if its
last check was over five minutes ago. Each request fetches the published
station sources anew. Responses and browser requests use `no-store`.
No ChatGPT hosting, ChatGPT credentials, GitHub Actions schedule or browser
access token is needed for wind readings. Existing private SWGOH routes retain
their authentication and origin checks.

The Worker uses the existing Workers Builds connection for this repository.
GitHub Pages retains its existing `main / (root)` publishing configuration.

## Sources and limits

- BOM: Williamtown, Nobbys, Cooranbong and Norah Head, with published histories.
- Marine Rescue Lake Macquarie: Swansea Heads / Salts Bay, one station. Reads
  its dated current-conditions page and Cumulus chart JSON. The provider
  publishes updates every 30 minutes.
- Marine Rescue Port Stephens, via WillyWeather: Nelson Head / Nelson Bay.
  The chart's declared units and Sydney wall-clock timestamps are converted
  to knots and UTC, including daylight saving.
- LMYC / Marks Point Meteo: published current reading. Its measurement time
  is not supplied in this view, so it stays marked time unverified. A
  historical series is not invented.
- Spot information: Jordan Jensen / Escape Eco Adventures, and Source quoted
  by JulesK on Seabreeze in August 2011. Original links and dates are retained.

Five-minute checks do not make a provider publish more often. Source outages
or format changes can prevent a gauge updating. Saved readings retain their
measurement time and are labelled; an open page retains its previous reading
if a later refresh fails. The map does not interpolate between gauges.

## Source and maintenance

Migrated from the Hunter Wind publication, version 5, source commit
`6d7372ae947d2466f89866ff7ce48e33697c438a`. The original ChatGPT publication
remains unchanged. `worker/hunter-wind.mjs` preserves its application and
parsers; its identifying User-Agent link now points here.

After changing the wind source, regenerate the static files and run checks:

```sh
node wind/build.mjs
node wind/tests/check-behaviour.mjs
node wind/tests/check-guides.mjs
node wind/tests/check-pages.mjs
node scripts/check-private-data.mjs
```

Commit the generated `wind/index.html`, `wind/leaflet.js`, `wind/leaflet.css`
and `wind/favicon.svg` with the source change. No package installation is
required. Keep the existing SWGOH dashboard files and private API configuration.
