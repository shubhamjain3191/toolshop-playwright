# Findings

Defects found in the Tool Shop application while building this suite. Each one
has a test that either covers it or documents the behaviour we'd expect instead.

---

## TS-001: `POST /products` performs no authorisation check

**Severity:** high
**Where:** `POST https://api.practicesoftwaretesting.com/products`

The catalogue write endpoints validate the request body but never check the
caller. A request with no `Authorization` header at all is accepted and returns
`201 Created` with the new product.

```
$ curl -s -o /dev/null -w '%{http_code}' -X POST https://api.practicesoftwaretesting.com/products \
    -H 'Content-Type: application/json' \
    -d '{"name":"Unauthorised","description":"x","price":9.99,
         "category_id":"<id>","brand_id":"<id>",
         "is_location_offer":false,"is_rental":false}'
201
```

A customer token produces the same result. It is not a case of the check being
too loose. There is no check.

Worth noting that this is inconsistent within the same API, which is what makes
it look like an oversight rather than a decision: `GET /users` correctly returns
`403 Forbidden` for a customer, and `GET /users/me` correctly returns `401` when
anonymous. The user endpoints are guarded; the catalogue endpoints are not.

**Expected:** `401` with no token, `403` for a non-admin token.

**Tests:** `tests/api/authorization.api.spec.js`, both marked `test.fixme`.
They are deliberately not executed: running them writes rows into a shared
public demo database on every CI run. Remove the `.fixme` to reproduce.

---

## TS-002: Registration returns 409 where the rest of the API returns 422

**Severity:** low (consistency)
**Where:** `POST /users/register`

Registering an email that already exists returns `409 Conflict` with a
field-keyed body:

```json
{ "email": ["A customer with this email address already exists."] }
```

Every other validation failure on the same endpoint returns `422`. The status
code is arguably the more correct of the two (the payload is well-formed, it
just conflicts), but a client written against the documented `422` behaviour
will miss it.

Not filed as a bug so much as pinned down: `tests/api/authentication.api.spec.js`
asserts the exact status and body so a future "let's tidy up the error handling"
change can't alter it silently.

---

## TS-003: Accessibility violations on catalogue and auth pages

**Severity:** medium
**Where:** `/`, `/auth/login`, `/auth/register`

axe-core (WCAG 2.0 A and AA) reports:

| Page             | Rule          | Impact       | Detail                                                                                  |
| ---------------- | ------------- | ------------ | --------------------------------------------------------------------------------------- |
| `/`              | `list`        | serious      | `<ul>` containing elements other than `<li>` - breaks list semantics for screen readers |
| `/auth/login`    | `button-name` | **critical** | a button with no discernible text, so it is announced as just "button"                  |
| `/auth/register` | `button-name` | critical     | same                                                                                    |
| `/auth/register` | `list`        | serious      | the password-help `<ul>` under `#passwordHelp` has the same non-`<li>` child problem    |

`button-name` is the one to fix first: a critical-impact violation on the login
page means a screen reader user can reach a control they cannot identify.

**Tests:** `tests/ui/accessibility.spec.js`. These are the current baseline:
the test passes today and fails on anything new, so the list above should only
ever get shorter.

---

## Notes, not defects

- The catalogue is queried using the HTTP `QUERY` method rather than `GET`.
  That's a draft standard and unusual to see in the wild; it is not wrong, but
  it does break tooling (and test predicates) that assume `GET`.
- The `brand` object embedded in a product omits `slug`, which the standalone
  `/brands` response includes. Modelled as two separate schemas rather than
  making the field optional, so that if `/brands` ever drops it, a test fails.
- The seeded demo customer has a billing address with no postal code, so the
  checkout address step starts out invalid even for a returning customer. Looks
  like seed data rather than a bug, but it is the reason the checkout test fills
  the address in rather than accepting the prefilled values.
