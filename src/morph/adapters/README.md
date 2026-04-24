# Morph-X Swift Adapter

Morph-X keeps the TypeScript CLI as the orchestrator and delegates semantic Swift
rewrites to an optional SwiftSyntax executable.

Set `MORPH_SWIFT_ADAPTER` to an executable that:

1. Reads one JSON request from stdin.
2. Writes one JSON response to stdout.
3. Leaves files untouched. The TypeScript CLI owns writes after validating the response.

Request shape:

```json
{
  "files": [{ "path": "/project/ViewModel.swift", "content": "..." }],
  "strategyFingerprint": "strategy:...",
  "strategyTags": ["control.guard-first"],
  "apply": true
}
```

Response shape:

```json
{
  "ok": true,
  "files": [
    {
      "path": "/project/ViewModel.swift",
      "changed": true,
      "content": "...",
      "warnings": []
    }
  ],
  "warnings": []
}
```

When the adapter is unavailable, Morph-X falls back to detection/reporting and
emits an `adapter_unavailable` warning instead of requiring Xcode for ordinary
GaleHarnessCLI usage.
