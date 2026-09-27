# Test strategy

Short version of the thinking behind this suite. It's written for the Tool Shop,
but the shape is what I'd apply to most web products.

## What gets automated where

The expensive mistake in UI automation is testing everything through the browser.
A browser test costs 3-8 seconds and fails for a dozen reasons unrelated to the
thing you're testing. An API test costs 200ms and fails for one.

So the rule here is: **test a rule once, at the cheapest layer that can prove it,
then use the UI to test what only the UI can test.**

| Question                                                   | Layer        | Why                                                                                             |
| ---------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| Does the price filter return the right products?           | API          | Pure business logic. No rendering involved.                                                     |
| Does the response still have the fields clients depend on? | API (schema) | A per-field assertion can't catch a field going missing.                                        |
| Can an anonymous caller create a product?                  | API          | Authorisation lives in the backend; going through the UI would only prove the button is hidden. |
| Does the grid re-render when I change the sort?            | UI           | This is wiring between the app and the API - the only place it exists.                          |
| Can a customer complete a purchase?                        | UI           | The four-step wizard, its state, and its validation are the feature.                            |
| Is the login button announced to a screen reader?          | UI (axe)     | Only observable in a rendered DOM.                                                              |

Concretely: search is tested at the API level for _correctness of results_, and at
the UI level for _does the page update_. Those are different questions and neither
covers the other.

## What's deliberately not here

- **Unit tests.** The application isn't mine; I can't meaningfully unit test it.
  On a product I owned, most of the validation logic currently covered by API
  tests would drop a layer.
- **Visual regression.** The demo instance has rotating content and third-party
  widgets. Screenshot diffs against it would produce noise, and a test that cries
  wolf gets ignored and then deleted. On a product I controlled I'd run visual
  diffs against a component library, where the inputs are pinned, rather than
  against full pages.
- **Load and performance.** Different tool, different pipeline, and not something
  to point at someone else's free demo server.

## Test design

**Every test sets up its own data.** Anything that mutates user-scoped state
registers a throwaway account through the API first. Nothing depends on the order
tests run in, and nothing depends on a previous test's leftovers. That's what
makes `fullyParallel` safe against a shared instance.

**Assertions compare against the API, not against hard-coded strings.** A test
that asserts the first product is "Combination Pliers" fails the day someone
reseeds the database, and that failure tells you nothing. Reading the expected
value from the API means the test fails only when the UI and the API disagree,
which is the actual bug.

**Negative cases get equal billing.** Wrong password, unknown account, empty
form, missing token, wrong role, no results. A feature isn't covered until you
know what it does when it's used wrong. The authorisation tests live in their own
file rather than as an afterthought at the bottom of a happy-path spec, because
a missing permission check is the failure that survives longest in production.

**Test names describe behaviour, not mechanics.** "rejects a wrong password
without saying which field was wrong" tells you what broke when it goes red.
"test login 2" doesn't.

## Flakiness

Treated as a defect in the test, not a fact of life.

- No `waitForTimeout` anywhere; the lint config makes it an error.
- Waits are tied to application events: a specific network response, a specific
  DOM state, a web-first assertion that retries.
- Retries are enabled in CI (2) and disabled locally, so a flake surfaces on the
  machine where it can be debugged instead of being silently swallowed.
- `trace: 'on-first-retry'` means any CI flake comes with a full trace attached.

The one structural risk is the dependency on a third-party environment. A slow
or down demo site produces red that isn't about the code. Running the app locally
from its docker-compose is the mitigation, and the suite supports it through
`.env`.

## Layering

Three layers, and the dependency only ever points one way:

1. **Tests**: what should happen. No selectors, no URLs.
2. **Page objects / API clients**: how to talk to the application. No assertions,
   with one exception: `applyAndWaitForResults` uses a retrying assertion as a
   synchronisation primitive.
3. **Fixtures, builders, config**: what a test needs before it starts.

If a test contains a CSS selector, it belongs in a page object. If a page object
contains an expected value, it belongs in the test.

## Selectors

`data-test` attributes, configured as Playwright's `testIdAttribute` so
`getByTestId()` picks them up. They exist for testing, so they don't move when
someone restyles a component. Where the app doesn't provide one (the toast
component is the only case), that's noted in a comment so it's a known weak point
rather than a surprise.

## The pipeline

Lint first, because it's five seconds and catches a committed `.only`. Then the
API suite and the three UI projects in parallel. Full cross-browser on the
nightly run; PRs get Chromium in full plus the `@smoke` slice on Firefox and
mobile. Cross-browser coverage matters, but not enough to make every PR wait
three times as long for it.
