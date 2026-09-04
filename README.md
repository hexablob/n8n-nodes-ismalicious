# n8n-nodes-ismalicious

n8n community node: check an IP address, domain, or URL against
[isMalicious](https://ismalicious.com) threat intelligence from inside a
workflow.

[![npm](https://img.shields.io/npm/v/n8n-nodes-ismalicious)](https://www.npmjs.com/package/n8n-nodes-ismalicious)

## What it does

One node, one operation: **Check** an indicator. It returns the reputation
verdict, the sources that list the indicator, and the enrichment isMalicious
holds for it — hosting, registration, and category — so the rest of the
workflow can branch on a real answer rather than a guess.

Typical uses:

- Score the sender domain of an inbound email before routing it.
- Check every URL in a webhook payload before an automation follows it.
- Enrich an alert with reputation data on its way to a ticket or a chat channel.

## Install

**Self-hosted n8n, from the editor:** Settings → Community nodes → Install →
`n8n-nodes-ismalicious`.

**From the command line:**

```bash
npm install n8n-nodes-ismalicious
```

## Credentials

Create an API key and secret at <https://ismalicious.com/app/account>, then add
an **isMalicious API** credential in n8n.

The credential has one field, **API Key**, and it does **not** take the raw key.
It takes the Base64 encoding of `apiKey:apiSecret` — the same value the REST API
expects in its `X-API-KEY` header. Produce it with:

```bash
printf '%s:%s' "$API_KEY" "$API_SECRET" | base64 -w0
```

Paste the result into **API Key**. Pasting the raw key instead is the one
mistake worth warning about: the node will build a valid request and the API
will answer 401.

**API URL** is optional and defaults to `https://api.ismalicious.com`. Override
it only for a private API host.

## Design notes

The package ships **no runtime dependencies**. n8n's verified community node
programme forbids them, so every HTTP call goes through n8n's own
`helpers.httpRequest`. That also means the node inherits n8n's proxy settings
and request logging rather than opening its own client.

With **Continue On Fail** enabled, a failing item becomes an error item on the
output instead of aborting the batch, which is the behaviour n8n users expect
from an enrichment node sitting in the middle of a loop.

## Development

```bash
npm install
npm test
npm run build
```

The node is developed in the isMalicious monorepo under
`packages/n8n-nodes-ismalicious` and mirrored to this repository for release:
npm will not verify a provenance statement built from a private repository,
and n8n's Creator Portal requires provenance.

## Release

Set the version in `package.json`, then tag:

```bash
git tag v0.1.0 && git push origin v0.1.0
```

The workflow type-checks, tests, builds, verifies that every path declared in
the `n8n` field exists in `dist/`, and publishes with sigstore provenance.

## Licence

MIT — see [LICENSE](LICENSE).
