# Changelog

## 0.1.1

Brings the package in line with n8n's community-node verification rules.
`@n8n/scan-community-package` failed 0.1.0 with 12 errors; 0.1.1 has none.

- The credential sends the key itself: an `authenticate` block adds the
  `X-API-KEY` header, and the node calls `httpRequestWithAuthentication`
  instead of reading the key and setting the header by hand.
- The credential has a test. **Test** in the credential dialog calls
  `GET /gate/quota`, which rejects a bad key with 401 and does not use up any
  of the monthly request quota.
- Errors are `NodeApiError`s (request failures, which keep their HTTP status)
  or `NodeOperationError`s (an empty indicator, now caught before any request
  is sent). In 0.1.0 the node re-threw the raw error.
- The node can be used as a tool by an AI Agent (`usableAsTool`). It also has
  a subtitle, and its inputs and outputs use `NodeConnectionTypes.Main`.
- The node and the credential declare their icon in `{ light, dark }` form.
  Both variants point to the same file, which renders on either theme.
- Requests carry `User-Agent: n8n-nodes-ismalicious/<version>`, so the API
  can attribute them to this node.
- `package.json`: `n8n-workflow` is a peer dependency (`*`), `author` has a
  name and an email, and `repository` points to the public repository that
  publishes the package.

## 0.1.0

First release: one **Check** operation that looks up an IP address, domain, or
URL with `GET /check`.
