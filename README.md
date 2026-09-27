# Tool Shop: Playwright test suite

End-to-end UI and API tests for [Practice Software Testing](https://practicesoftwaretesting.com)
(the "Tool Shop"), an intentionally realistic e-commerce demo app: Angular front end,
Laravel REST API, real login, real cart, real checkout.

I built this as a working reference for how I like an automation suite to be
structured. The page objects, fixtures and waiting strategy are the parts I
actually care about; the tests are there to exercise them.

## Running it

```bash
npm ci
npx playwright install
cp .env.example .env     # optional, the defaults point at the public demo

npm test                 # everything
npm run test:api         # API only, ~10s
npm run test:ui          # UI on Chromium
npm run test:smoke       # the @smoke slice
npm run report           # open the last HTML report
```

No local setup is needed: the suite runs against the hosted demo instance by
default. If you want to run it against your own copy, the app ships a
docker-compose in [its repo](https://github.com/testsmith-io/practice-software-testing);
point `UI_BASE_URL` and `API_BASE_URL` at it in `.env`.

## What's covered

| Area           | Tests                                                                                | Notes                                                             |
| -------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Catalogue      | search, sort, category filter, pagination, empty state, stock labels                 | grid re-render is synchronised to the API response, not a timeout |
| Product detail | price, description, spec table, quantity stepper                                     | detail values are cross-checked against the API                   |
| Cart           | add, multi-item, quantity change, totals, persistence across reload                  |                                                                   |
| Checkout       | full order via bank transfer and credit card, address validation, anonymous redirect | the four-step wizard                                              |
| Auth (UI)      | login, logout, bad credentials, user enumeration, registration                       |                                                                   |
| Auth (API)     | register, login, token shape, 401/403 handling                                       |                                                                   |
| Catalogue API  | pagination, search, price filter, 404, brand/category tree                           |                                                                   |
| Contract       | zod schemas over every response body                                                 |                                                                   |
| Accessibility  | axe-core on catalogue, login, registration                                           | baseline-based, see below                                         |

59 specs, 103 runs once the browser matrix is applied. Chromium and Firefox get
the full suite, the mobile viewport runs the `@smoke` slice.

## How it's put together

```
src/
  api/        HTTP client, per-resource API wrappers, zod response schemas
  config/     the only place that reads process.env
  data/       test-data builders (faker) and fixed checkout data
  fixtures/   custom test fixtures (page objects, API clients, auth)
  pages/      page objects, one per screen, plus shared components
tests/
  api/        API and contract tests
  ui/         browser tests
```

A few decisions worth explaining, since they're the ones I'd ask about in an interview:

**Waiting is synchronised to the application, never to the clock.** There isn't a
single `waitForTimeout` in the suite, and the lint rules forbid one. The
catalogue was the interesting case: every filter replaces the contents of a grid
that is _already_ populated, so the obvious "wait for a product card to appear"
returns instantly and you assert against the previous results. `HomePage.applyAndWaitForResults()`
waits for the catalogue response, reads the payload, and then waits for the DOM
to match it. That turned eight intermittent failures into zero.

One wrinkle that cost me a while: the front end issues those catalogue calls with
the HTTP **QUERY** method, not GET, so a `waitForResponse` predicate checking for
`'GET'` silently never fires.

**Authentication is seeded, not clicked.** The app stores its JWT in
localStorage under `auth-token`. The `signInAsCustomer` fixture gets a token from
the API and injects it via `addInitScript`, which is about two seconds faster per
test than driving the login form. Deliberately _not_ a `storageState` file: the
API issues tokens with a 300-second TTL, so a state file written once at the
start of a run is expired long before the run ends.

**The API is used to set up and to verify UI tests.** Product names, prices and
category ids come from the API rather than being hard-coded, so a reseeded
environment doesn't produce a wall of red. The UI tests assert that what's on
screen matches what the API returned.

**Tests own their data.** Anything that mutates a user registers a throwaway
account first (`newCustomer` fixture) rather than sharing the seeded one, so the
suite can run fully parallel against a shared instance.

**Schemas, not field spot-checks.** Asserting `response.name === 'Hammer'` proves
one field works. The zod schemas in `src/api/schemas.js` validate the whole body,
which is what catches a price that started arriving as a string or a field that
quietly disappeared. Writing them found a real inconsistency, see below.

## Findings

Writing the tests turned up a few genuine defects in the application. They're
written up in [docs/FINDINGS.md](docs/FINDINGS.md); the headline is that
`POST /products` has no authorisation check at all and will happily accept an
anonymous request.

## Known gaps

Being honest about what this doesn't do:

- **No visual regression.** The demo instance has rotating promotional content
  and third-party widgets, so screenshot diffs would be noise. On a product I
  controlled I'd add them for the component library, not for full pages.
- **The accessibility check is baselined, not clean.** The app has existing WCAG
  violations. Failing the build on all of them on day one gets the check deleted;
  instead each page has an allowlist and the test fails on anything _new_. The
  allowlist is a to-do list, not a statement that those issues are fine.
- **Two authorisation tests are `fixme`.** They document a real bug, but running
  them writes junk records into a shared public demo database, which isn't a
  reasonable thing to do to someone else's server on every CI run. Drop the
  `.fixme` to reproduce locally.
- **The suite depends on a third-party environment.** If the demo site is down
  or slow, the nightly run goes red for reasons that have nothing to do with the
  tests. A local docker instance is the fix and is supported via `.env`.

## CI

GitHub Actions runs lint, then the API suite and the UI suites in parallel, on
every push and PR plus nightly at 02:00 UTC. HTML reports, traces and failure
videos are uploaded as artifacts and kept for 14 days. Retries are on in CI only
(2); locally a flaky test should fail so you notice it.

## Test strategy

The reasoning behind the coverage choices, what's tested at which layer and why,
is in [docs/TEST-STRATEGY.md](docs/TEST-STRATEGY.md).
