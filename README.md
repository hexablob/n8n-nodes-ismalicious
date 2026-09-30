# n8n-nodes-ismalicious

n8n community node: check an IP address, domain, or URL against
[isMalicious](https://ismalicious.com) threat intelligence from inside a
workflow.

[![npm](https://img.shields.io/npm/v/n8n-nodes-ismalicious)](https://www.npmjs.com/package/n8n-nodes-ismalicious)

## What it does

One node, one operation: **Check** an indicator. It returns the reputation
verdict, the sources that list the indicator, and the enrichment isMalicious
holds for it (hosting, registration, category), so the rest of the workflow
can branch on the result.

Typical uses:

- Score the sender domain of an inbound email before routing it.
- Check every URL in a webhook payload before an automation follows it.
- Enrich an alert with reputation data on its way to a ticket or a chat channel.
- Give an AI Agent a reputation lookup: the node can be attached as a tool.

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

The credential has one required field, **API Key**. It does **not** take the
raw key: it takes the Base64 encoding of `apiKey:apiSecret`, the same value the
REST API expects in its `X-API-KEY` header. Produce it with:

```bash
printf '%s:%s' "$API_KEY" "$API_SECRET" | base64 -w0
```

Paste the result into **API Key**. If you paste the raw key instead, **Test**
in the credential dialog fails with 401. That test calls `GET /gate/quota`,
which checks the key without using up any of the monthly request quota.

**API URL** is optional and defaults to `https://api.ismalicious.com`. Change
it only if you use a private API host.

## Design notes

The package has **no runtime dependencies**, as n8n's verified community node
programme requires. `n8n-workflow` is a peer dependency that n8n itself
provides. Requests go through `httpRequestWithAuthentication`, and the
credential's `authenticate` block adds the key. The node therefore uses n8n's
proxy settings and request logging, not a client of its own.

With **Continue On Fail** enabled, an item that fails becomes an error item in
the output, and the rest of the batch still runs. That is what n8n users expect
from an enrichment node placed inside a loop.

## Development

The node is developed in the isMalicious monorepo under
`packages/n8n-nodes-ismalicious` and copied to
[hexablob/n8n-nodes-ismalicious](https://github.com/hexablob/n8n-nodes-ismalicious)
for release. The copy exists because npm will not verify a provenance statement
built from a private repository, and n8n's Creator Portal requires provenance.

```bash
npm test          # vitest
npm run lint      # n8n's verification scanner, on the sources
npm run scan      # build, npm pack, then the scanner on sources and tarball
```

`npm run scan` runs the lint passes of `@n8n/scan-community-package`, using
the scanner's own code and rules, on this directory and on the tarball
`npm pack` produces. A version can therefore reach zero errors before it is
published. The one check it cannot run is provenance, which only exists once
the package is on npm.

## Release

1. Set `version` in `package.json` and `USER_AGENT` in `src/check-request.ts`
   (a test fails when they disagree), and add a `CHANGELOG.md` entry.
2. `npm run scan` must report `passed` for both source and tarball.
3. Copy the package into the public repository and tag it. The tag triggers
   that repository's `publish.yml`, which publishes with sigstore provenance:

   ```bash
   rsync -a --delete --exclude .git --exclude .github --exclude .gitignore \
     --exclude node_modules --exclude dist \
     packages/n8n-nodes-ismalicious/ ../n8n-nodes-ismalicious/
   cd ../n8n-nodes-ismalicious
   git add -A && git commit -m "release: v0.1.1"
   git tag v0.1.1 && git push origin main v0.1.1
   ```

4. Check the published package: `npx @n8n/scan-community-package n8n-nodes-ismalicious@0.1.1`.
   Once it passes, submit the package at <https://creators.n8n.io/nodes>.

The package name must stay `n8n-nodes-ismalicious` and keep the
`n8n-community-node-package` keyword.

## Licence

MIT. See [LICENSE](LICENSE).
