# Titan

A keyboard-first Brave extension built on Vimium 2.4.2, with an Arc-inspired launcher. No build step, account, backend, or runtime packages to install. Vimium's navigation, link hints, scrolling, find, tab commands, and Vomnibar UI remain intact; Titan adds pins, folders, and slash shortcuts to that interface. See [UPSTREAM.md](UPSTREAM.md) and [MIT-LICENSE.txt](MIT-LICENSE.txt).

## Install in Brave

1. Disable Vimium in `brave://extensions` to avoid competing shortcuts.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select `/home/manan/programming/projects/titan` (the folder containing `manifest.json`).
4. Pin Titan from the extensions menu if you want its toolbar button.
5. Refresh existing website tabs. Titan preserves Brave's native new-tab page. If upgrading from 0.1.0, reload Titan and close any old Titan new-tab pages; newly opened tabs use Brave's page.

To open Titan's settings, click the Titan toolbar button and choose **Titan Settings**, or open `brave://extensions` → Titan → **Details** → **Extension options**. The Vimium help dialog (`?`) and exclusion dialog link to this same page.

**Upgrading from standalone Titan:** export a backup first, then click Reload for Titan in `brave://extensions` and refresh all website tabs. Brave may ask you to approve the expanded permissions used by Vimium's engine. Your existing pins, folders, shortcuts and preferences are retained. Older Titan JSON backups remain supported. If an old tab behaves oddly after reload, close and reopen that tab to discard its previous content scripts.

On another machine, clone `https://github.com/MananDesai54/titan.git` once the source is published, then load that directory unpacked.

## Use

| Key | Action |
| --- | --- |
| `Shift+T` | Open Titan's Vimium-style launcher; selected results always open in a new tab |
| `Alt+T` | Open the toolbar popup, including from restricted pages/address bar |
| `/` inside Titan | Pin this page, browse pins/folders, settings, export |
| `Shift+1` … `Shift+9` | Open/focus the first nine saved pins |
| `↑` / `↓`, `Enter` | Select and open a result |
| `→` / `←` | Expand a folder / return to the folder list |
| `Esc` | Dismiss Titan or link hints |
| `i` | Enter insert mode to type into a webpage |
| `Esc` in insert mode | Return to normal mode |
| `j` / `k`, `h` / `l` | Scroll down/up, left/right |
| `d` / `u` | Scroll down/up half a viewport |
| `gg` / `Shift+G` | Top/bottom |
| `f` / `Shift+F` | Link hints; hinted links always open in a new tab |
| `/` on the webpage | Vimium's find-in-page mode |
| `J` / `K`, `x` / `X` | Previous/next tab, close/restore tab |
| `?` | Show the active keyboard mappings |

The empty Vomnibar shows only pins and folders. History is queried only after you type. Search matches pins, open tabs, bookmarks and history, including older history. Vimium renders the result list and keyboard interaction. Existing matching tabs are focused instead of duplicated. Number shortcuts always follow the pin order in Settings, regardless of folder.

Webpages start in **normal mode**, even if a textbox has focus. Press `i` to enter **insert mode** and type; press `Esc` to return to navigation. When no editor is focused, `i` focuses the first visible editor. Titan's launcher uses Vimium's own authenticated Vomnibar iframe, so its focus behavior comes from Vimium.

The separate default `o`, `O`, `b`, `B`, `ge`, `gE` and `:` launchers are removed. Use `Shift+T` for everything. US-layout shifted number symbols are the default pin bindings; other layouts can map their keys to `Titan.pin1` through `Titan.pin9` in Settings.

Open **Settings** from Titan or the extension's **Details → Extension options**. All preferences, folders, pin names/URLs/order and JSON backup/restore are on this one page. Save applies the draft; Discard reloads the saved configuration. Deleting a folder moves its pins out of the folder. Export downloads the saved configuration; import validates a file and loads it as a draft, then Save applies it. Keep a backup before replacing existing configuration.

The same page includes Vimium-style custom key mappings, link-hint letters and smooth scrolling. For example, `map s scrollDown`, `map <a-space> Titan.activate`, or `unmap x`. Invalid mappings are rejected when saving. All of these settings are included in Titan's configuration export.

### Custom slash shortcuts

Paste direct shortcuts into **Settings → Custom / shortcuts**, then **Save settings**:

```text
w!: https://www.wikipedia.org/ Wikipedia
g!: https://www.google.com/ Google
y!: https://www.youtube.com/ YouTube
chatgpt: https://chatgpt.com/
claude: https://claude.ai/new/
```

Use the same `name: URL Optional label` format for your own environments and dashboards. Blank lines and `#` comments are allowed. Names are case-insensitive and must be unique. No `%s` templates: each shortcut opens exactly its saved URL. Query parameters in URLs are preserved.

Type `/` in Titan to see these alongside built-in commands, or filter with `/claude`, `/g!`, etc. Custom shortcuts are only matched under `/`; plain text still searches tabs, pins, history, bookmarks and the web. Shortcuts are included in JSON export/import. Older backups without shortcuts remain compatible.

## Try it out

1. Visit several sites, then refresh one and press `Shift+T`. Search for a visited page's title: a history result should appear. Search for an open tab and press Enter: Titan should focus it.
2. Type a phrase that doesn't match anything and press Enter. Your default search engine should open. Try `example.com` as well.
3. On a normal website, open Titan, type `/`, choose **Pin this page**. Open Settings, add a folder, assign the pin, and Save. Reopen Titan: the pin and folder should appear.
4. Add a second pin, save, and use `Shift+1` / `Shift+2` from a webpage. Reorder pins in Settings and save; shortcuts should follow the new order.
5. On a long page, use `j/k`, `d/u`, `gg`, `G`. Press `f`, then the letters displayed over a visible link. Use `Esc` to cancel and `Shift+F` for a new tab.
6. Focus a webpage input: `Shift+T` should open Titan and text should go into its search field. Close Titan, press `i`, type into the webpage, then press `Esc` to resume navigation.
7. Export configuration, change a setting and Save, import the backup and Save. Confirm pins, folders and preferences are restored. An invalid JSON file should show an error without changing saved settings.
8. Restart Brave and check that saved pins and folders persist. On `brave://extensions`, use `Alt+T` or the toolbar button.

## Scope and limitations

- Shift-only bindings are webpage shortcuts and cannot intercept keys in Brave's address bar, browser settings, Web Store, built-in PDF viewer, or other extensions. Use `Alt+T` or the toolbar button there. Reassign Alt+T at `brave://extensions/shortcuts` if it conflicts.
- Normal mode intentionally handles keys even in focused typing fields. Enter insert mode first to edit the webpage. Vimium's frame and shadow-DOM handling is retained; inaccessible browser frames and sites that intercept window events before the extension can still limit navigation.
- Pins are saved website shortcuts, not Brave's native pinned tabs. Folders organize pins with one level of nesting. This is an Arc-inspired launcher, not a replacement for Brave's tab strip.
- The extension does not replace Brave's new-tab page. `Shift+T` cannot work on Brave's native new-tab page because extensions cannot inject there and browser-wide extension commands require Ctrl or Alt. Use `Alt+T` or the toolbar button there. Search history stays in Brave; Titan only reads it for local suggestions and does not export it.
- Titan's canonical configuration is local to this profile; use export/import to move it. Vimium's engine mirrors navigation preferences into browser sync storage. No telemetry or remote suggestion service is enabled for Titan's launcher. URLs are opened only when selected.
- Reload the extension in `brave://extensions` after editing its files, then refresh existing website tabs.

## Development

`npm test` runs configuration and search tests; `npm run check` checks JavaScript syntax. There are no packages to install for normal use.

The retained Vimium unit suite runs with `deno run --node-modules-dir=auto --allow-read --allow-write --allow-env --allow-net --allow-run --allow-sys make.js test-unit` (development dependencies download on first run).

The real extension browser suite uses Playwright and a disposable profile: `PLAYWRIGHT_PATH=/path/to/playwright/index.mjs node tests/browser.mjs`. It defaults to `/usr/lib/chromium/chromium`; set `CHROMIUM_PATH` for a different Chromium/Brave binary. It tests settings, backups, history visibility, result scrolling, normal/insert mode, textbox focus, link hints, pins and existing-tab reuse.

Permissions: `storage` saves configuration, `tabs` manages tabs, `history` and `bookmarks` supply suggestions, and `search` invokes the default search engine. Vimium uses `sessions` to restore closed tabs, `scripting` for content styles/scripts, `webNavigation` to track frame/SPA navigation, and `favicon` for icons. All-site access supports navigation and hints across frames and websites. File and incognito access remain opt-in in Brave. Titan does not delete history or bookmarks.
