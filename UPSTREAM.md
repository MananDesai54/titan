# Vimium source provenance

Titan incorporates Vimium from https://github.com/philc/vimium at commit
`5aa29614bf1dce05e0d316f8c38722e17f9b38c3` (upstream version 2.4.2).

The upstream runtime, assets, tests and development scripts are retained. The original
README is `README.vimium.md`; the upstream license is `MIT-LICENSE.txt` and credits are
in `CREDITS`. Titan's manifest and product README replace the upstream versions.

Titan-specific changes are documented in its Git commits. The earlier standalone
implementation, including its unfinished focus fixes, is preserved on the local
`backup/titan-standalone` branch.

Runtime customizations:

- `background.js` loads Vimium's worker and bridges Titan configuration into the engine.
- `content_scripts/titan.js` routes Titan's launcher and pin commands through Vimium's mode stack.
- Titan uses Vimium's native Vomnibar UI; its pins and slash shortcuts are an additional completer.
- Explicit insert mode replaces automatic insert-on-focus for website textboxes.
- Titan's settings replace the upstream options entry point and default split launcher bindings. Legacy source files remain for upstream tests and custom command compatibility.
- Upstream new-tab navigation and update notifications are disabled; Brave's native new-tab page is preserved.
