# Titan

A keyboard-first Brave extension inspired by Arc and Vimium. No build step, account, backend, or runtime dependencies.

## Install in Brave

1. Disable Vimium in `brave://extensions` to avoid competing shortcuts.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select `/home/manan/programming/projects/titan` (the folder containing `manifest.json`).
4. Pin Titan from the extensions menu if you want its toolbar button.
5. Refresh existing website tabs. Open a new tab and accept/keep Titan as the new-tab page if Brave prompts you.

On another machine, clone `https://github.com/MananDesai54/titan.git` once the source is published, then load that directory unpacked.

## Use

| Key | Action |
| --- | --- |
| `Shift+T` | Open the unified command bar on a website |
| `Alt+T` | Open the toolbar popup, including from restricted pages/address bar |
| `/` inside Titan | Pin this page, browse pins/folders, settings, export |
| `Shift+1` … `Shift+9` | Open/focus the first nine saved pins |
| `↑` / `↓`, `Enter` | Select and open a result |
| `Esc` | Dismiss Titan or link hints |
| `j` / `k`, `h` / `l` | Scroll down/up, left/right |
| `d` / `u` | Scroll down/up half a viewport |
| `gg` / `Shift+G` | Top/bottom |
| `f` / `Shift+F` | Link hints; Shift opens links in a new tab |

Type to search pins, open tabs, bookmarks and browser history, including older history. The last result searches through your default browser search engine or opens a URL. Existing matching tabs are focused instead of duplicated. Search results prioritize matching pins and tabs. The home view shows pins with folders, plus recent tabs/history. Number shortcuts always follow the pin order in Settings, regardless of folder.

Open **Settings** from Titan or the extension's **Details → Extension options**. All preferences, folders, pin names/URLs/order and JSON backup/restore are on this one page. Save applies the draft; Discard reloads the saved configuration. Deleting a folder moves its pins out of the folder. Export downloads the saved configuration; import validates a file and loads it as a draft, then Save applies it. Keep a backup before replacing existing configuration.

## Try it out

1. Visit several sites, then refresh one and press `Shift+T`. Search for a visited page's title: a history result should appear. Search for an open tab and press Enter: Titan should focus it.
2. Type a phrase that doesn't match anything and press Enter. Your default search engine should open. Try `example.com` as well.
3. On a normal website, open Titan, type `/`, choose **Pin this page**. Open Settings, add a folder, assign the pin, and Save. Reopen Titan: the pin and folder should appear.
4. Add a second pin, save, and use `Shift+1` / `Shift+2` from a webpage. Reorder pins in Settings and save; shortcuts should follow the new order.
5. On a long page, use `j/k`, `d/u`, `gg`, `G`. Press `f`, then the letters displayed over a visible link. Use `Esc` to cancel and `Shift+F` for a new tab.
6. Focus an input on a website and type normally, including uppercase T and punctuation. Titan must not take over typing.
7. Export configuration, change a setting and Save, import the backup and Save. Confirm pins, folders and preferences are restored. An invalid JSON file should show an error without changing saved settings.
8. Restart Brave and check that saved pins and folders persist. On `brave://extensions`, use `Alt+T` or the toolbar button.

## Scope and limitations

- Shift-only bindings are webpage shortcuts and cannot intercept keys in Brave's address bar, browser settings, Web Store, built-in PDF viewer, or other extensions. Use `Alt+T` or the toolbar button there. Reassign Alt+T at `brave://extensions/shortcuts` if it conflicts.
- Vim shortcuts deliberately do not run in typing fields. They operate in the main webpage; nested frames and controls inside website shadow roots are not covered in this first version. Sites that intercept keyboard events before Titan may interfere.
- Pins are saved website shortcuts, not Brave's native pinned tabs. Folders organize pins with one level of nesting. This is an Arc-inspired launcher, not a replacement for Brave's tab strip.
- The extension replaces Brave's new-tab page. To undo that, disable Titan. Search history stays in Brave; Titan only reads it for local suggestions and does not export it.
- Storage is local to this browser profile; use export/import to move your configuration. No telemetry or remote suggestion service. URLs are opened only when selected.
- Reload the extension in `brave://extensions` after editing its files, then refresh existing website tabs.

## Development

`npm test` runs configuration and search tests; `npm run check` checks JavaScript syntax. There are no packages to install for normal use.

Permissions: `storage` saves configuration, `tabs` finds/focuses open tabs, `history` and `bookmarks` provide suggestions, and `search` invokes the default browser search engine. HTTP/HTTPS content scripts provide webpage keyboard navigation. No bookmark or history write/delete operations are used.
