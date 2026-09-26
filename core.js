export const navigationDefaults = () => ({keyMappings:'', smoothScroll:true, linkHintCharacters:'sadfjklewcmpgh'});
export const defaults = () => ({version: 1, pins: [], folders: [], shortcuts: '', navigation:navigationDefaults(), settings: {vim: true, newTab: true, scrollStep: 100}});
export function parseShortcuts(text = '') {
  if (typeof text !== 'string' || text.length > 200000) throw Error('Shortcuts must be text (maximum 200,000 characters).');
  const aliases = new Set();
  return text.split(/\r?\n/).flatMap((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return [];
    const match = trimmed.match(/^([a-z0-9_!-]+):\s*(\S+)(?:\s+(.+))?$/i);
    if (!match || !safeUrl(match[2])) throw Error(`Shortcut line ${index + 1}: use name: https://example.com/ Optional label`);
    const [, alias, url, label] = match;
    if (url.includes('%s')) throw Error(`Shortcut line ${index + 1}: use a direct URL without %s.`);
    if (aliases.has(alias.toLowerCase())) throw Error(`Shortcut line ${index + 1}: duplicate name ${alias}.`);
    aliases.add(alias.toLowerCase());
    return [{alias, name: label || alias, url: safeUrl(url), kind: 'shortcut'}];
  });
}
export function shortcutResults(text, query) {
  if (!query.startsWith('/')) return [];
  const q = query.slice(1).trim().toLowerCase();
  return parseShortcuts(text).filter(x => `${x.alias} ${x.name} ${x.url}`.toLowerCase().includes(q))
    .sort((a,b) => Number(b.alias.toLowerCase() === q) - Number(a.alias.toLowerCase() === q));
}
export function safeUrl(value) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function destination(value) {
  const text = value.trim();
  return safeUrl(text) || (/^(localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?([/?#]\S*)?$/.test(text) ? safeUrl(`https://${text}`) : null);
}
export function validateConfig(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.pins) || !Array.isArray(data.folders) || data.pins.length > 1000 || data.folders.length > 100) throw Error("Invalid Titan configuration (expected version 1).");
  const ids = new Set();
  const check = (x) => {
    if (!x || typeof x.id !== "string" || !x.id || ids.has(x.id) || typeof x.name !== "string" || !x.name.trim() || x.name.length > 200) throw Error("Invalid or duplicate item.");
    ids.add(x.id);
  };
  const folders = data.folders.map(x => { check(x); return {id: x.id, name: x.name.trim()}; });
  const pins = data.pins.map(x => {
    check(x);
    if (!safeUrl(x.url) || (x.folder && !folders.some(f => f.id === x.folder))) throw Error("Invalid pin URL or folder.");
    return {id: x.id, name: x.name.trim(), url: safeUrl(x.url), folder: x.folder || ""};
  });
  const s = data.settings;
  if (!s || typeof s.vim !== "boolean" || typeof s.newTab !== "boolean" || !Number.isInteger(s.scrollStep) || s.scrollStep < 20 || s.scrollStep > 1000) throw Error("Invalid settings.");
  const shortcuts = data.shortcuts ?? '';
  parseShortcuts(shortcuts);
  const navigation={...navigationDefaults(),...data.navigation};
  if(typeof navigation.keyMappings !== 'string' || navigation.keyMappings.length>6000 || typeof navigation.smoothScroll !== 'boolean' || typeof navigation.linkHintCharacters !== 'string' || !/^[a-z]{2,26}$/.test(navigation.linkHintCharacters) || new Set(navigation.linkHintCharacters).size!==navigation.linkHintCharacters.length)throw Error('Invalid keyboard settings: use 2–26 unique lowercase hint letters.');
  return {version: 1, pins, folders, shortcuts, navigation, settings: {vim: s.vim, newTab: s.newTab, scrollStep: s.scrollStep}};
}
export function rank(items, query) {
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);
  const score = x => ({pin: 40, tab: 30, bookmark: 20, history: 10}[x.kind] || 0) + (x.name.toLowerCase().startsWith(q) ? 50 : 0);
  return items.filter(x => terms.every(t => `${x.name} ${x.url}`.toLowerCase().includes(t))).sort((a,b) => score(b) - score(a)).slice(0, 60);
}
