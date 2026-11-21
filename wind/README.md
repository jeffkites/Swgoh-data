# Hunter Wind

Map and compact station wind histories for Lake Macquarie, Newcastle and Nelson Bay.

Page: https://jeffkites.github.io/wind/

The same export remains available at https://jeffkites.github.io/Swgoh-data/wind/.
The shorter address is served by `jeffkites/jeffkites.github.io`, using the four
static assets generated here. Keep both copies in sync when changing the map;
live readings refresh directly from the same existing Cloudflare service.

## Hosting and live data

GitHub Pages serves this directory alongside the existing SWGOH dashboard at
the repository root. All wind assets use relative paths. Seven gauges, history
periods and author/source credits are retained. The original Along the coast
wind map shows all seven gauges together, with all stations in its list.
The wind map is fixed: dragging and map zoom are disabled, including automatic
panning on gauge selection or focus. Phone swipes scroll the page over it;
gauge pins remain clickable. The coast is fitted on load and viewport resize.
Kiting site reviews have a separate
map with Lake Mac/Newcastle, Nelson Bay and Central Coast views. Site region
buttons only change that review map and its cards; they preserve the selected
wind gauge, chart and wind-map position. Live refresh preserves both map views.

The site map has 19 numbered site links: the original 13 credited guides,
a Mawsons Wall / Spoons nomination awaiting local review, and
five links to Jordan Jensen's original Nelson Bay reviews. Nelson Bay directions
and launch instructions are not copied or inferred. Each original review is
linked from its credited panel.

worker/hunter-map.mjs contains the regional grouping and approximate place
references, distinct from weather-station coordinates. Positions were checked
against OpenStreetMap via Nominatim on 21 November 2026. Each reference records
its source feature URL. Spoon Rocks uses GeoNames (CC BY 4.0). These identify review areas, not verified launch sites;
some use a nearby named access feature or a beach's southern boundary. Map data
is credited to OpenStreetMap contributors (ODbL 1.0). Closely spaced pin labels
are offset for readability. No geocoder is called by visitors or on refresh.

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

## Wind colours and recent trends

The map's arrows and marker borders, gauge cards and history chart share one
average-wind speed scale: red below 12 knots, yellow from 12 to below 16, green
from 16 to below 30, and brown from 30 knots upwards. Missing/invalid wind
readings are grey. The map retains all seven gauges together.

Each station row has a 40-pixel-high history plot, replacing the separate
large history panel and repeated current-reading blocks in the station list.
The default range is six hours, with shared 1h/3h/6h/24h controls for all gauges.
Current readings remain on the full-coast map. Old #history bookmarks redirect
to #stations.

History plots place coloured direction arrows at the measured average speed,
so their height shows whether wind is building or easing. Arrows point where
the wind goes. Calm readings and missing direction use dots. Gusts appear as translucent grey arrows behind the coloured averages. Both
series use the published wind bearing because these feeds do not expose a
separate gust direction. No waves or forecast data are inferred. Timed readings
are sorted and deduplicated, and gaps longer than 50 minutes or missing
measurements are not joined. Dense series are sampled for readable arrows,
while the lines and hover/tap/keyboard inspection retain the actual readings.
Each compact chart fits phone widths. Hover, tap or keyboard focus supports
Left/Right, Home/End and Escape to inspect or dismiss exact readings. A station
without timed history displays an unavailable message and retains its source
link. Its history is never fabricated.

Rising/Falling/Steady compares average wind with a reading about 20 minutes
earlier, allowing a real 5–45 minute source cadence. Changes of at least one
knot are rising/falling; smaller changes are steady. The comparison period is
shown beside the change. Trend is unavailable without a valid recent timed
pair, for saved fallbacks, or when the latest measurement is over 90 minutes
old. A wind direction arrow is separate from the recent speed trend.

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
- Nelson Bay source reviews: Jordan Jensen, [Kitesurfing in Nelson Bay](https://www.escapeecoadventures.com.au/post/kitesurfing-in-nelson-bay),
  23 July 2021. Map links cover Jimmy's, Bennett's/Waynderrabah, Bagnall's,
  Birubi and Fingal Bay/Spit; the full reviews remain on the author's site.

Five-minute checks do not make a provider publish more often. Source outages
or format changes can prevent a gauge updating. Saved readings retain their
measurement time and are labelled; an open page retains its previous reading
if a later refresh fails. The map does not interpolate between gauges.

## Editing and approving site notes

Open https://jeffkites.github.io/wind/#review-desk and unlock with the existing
SWGOH dashboard owner key. No new credentials are created. The key is used only
in the Authorization header and kept in memory until Lock or a page reload.
Search accepts site aliases across all regions; Squids / Squid’s Ink also has a
shortcut. Site panels have an Edit & review this site button.

The Wind from selector filters both review cards and pins using the 16 compass
points. Direction-only filtering uses the selected site region; a name search
still searches all regions and combines with the selected direction. It uses
Jeff’s published directions when present, otherwise the credited guide. Unknown
directions are excluded while a direction is selected. Private drafts do not
change public search.

Write N–SE to include N, NNE, NE, ENE, E, ESE and SE automatically. Ranges follow
the shorter arc (S–NE goes via E). Commas, slashes and middle dots are lists,
not ranges. Opposite endpoints such as SW–NE match only the two endpoints until
a middle point specifies the intended half: SW–S–NE or SW–W–NE. The owner editor
previews the expanded directions. The filter reads listed guidance; it does
not infer directions from a shoreline or the reference weather gauge.

The initial queue has 16 researched private drafts, including five Nelson Bay
sites and mixed-sport candidates for local assessment. Sources and dates are
retained. A windsurfing description does not establish a kite launch; Spoon
Rocks has location evidence but no verified kite-specific review. Research is
not automatically approved as Jeff.

Save private draft stores changes without changing the public map. Approve &
publish explicitly copies the edited draft into the public projection. Your
approved notes appear separately from Jordan Jensen’s guide and Source’s
historical post. Removing published notes preserves the original source guide
and private draft. New sites require a valid map position before publishing;
use Pick position on site map or enter coordinates. Existing source notes and
source-author credits are retained separately from your edits.

The Worker routes are /api/wind/reviews (public approved projection only) and
/api/wind/reviews/manage (owner GET/POST with the same dashboard key and exact
Pages origin). Both read/write only the dedicated private repository file
jeffkites/swgoh-private-data/data/wind-reviews.json using the existing Worker
PRIVATE_DATA_GITHUB_TOKEN. No game snapshot or caller-supplied storage path is
accessible through these routes. Private drafts are never embedded in the
static export or returned by the public endpoint. GitHub file SHA checks reject
stale edits rather than overwriting another device’s work. On a conflict, copy
your unsaved text before reloading the queue. Source outages leave saved forms
and the original static guide set available. Public approved notes reload when
the page opens, on manual refresh and with the normal five-minute checks.

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
node wind/tests/check-maps.mjs
node wind/tests/check-directions.mjs
node wind/tests/check-wind-display.mjs
node wind/tests/check-reviews.mjs
node scripts/check-private-data.mjs
```

Commit the generated `wind/index.html`, `wind/leaflet.js`, `wind/leaflet.css`
and `wind/favicon.svg` with the source change. No package installation is
required. Keep the existing SWGOH dashboard files and private API configuration.
