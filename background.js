import './background_scripts/main.js';
import {Commands, KeyMappingsParser} from './background_scripts/commands.js';
import {defaults, validateConfig, safeUrl, destination, rank, shortcutResults} from './core.js';
const config = async () => validateConfig((await chrome.storage.local.get('config')).config || defaults());
async function syncNavigation(c) {
  await Settings.onLoaded();
  await Settings.setSettings({...Settings.getSettings(), keyMappings:c.navigation.keyMappings,
    scrollStepSize:c.settings.scrollStep, smoothScroll:c.navigation.smoothScroll,
    linkHintCharacters:c.navigation.linkHintCharacters, titanVimEnabled:c.settings.vim,
    newTabDestination:'browserNewTabPage', openVomnibarOnNewTabPage:false,
    exclusionRules:[], hideUpdateNotifications:true, searchEngines:''});
  await Commands.loadKeyMappings(c.navigation.keyMappings);
}
const ready = config().then(syncNavigation);
let writes = Promise.resolve();
function mutate(fn) {
  const next = writes.then(async () => { await ready; const c = await config(); const result = validateConfig(await fn(c));
    const parsed=KeyMappingsParser.parse(result.navigation.keyMappings);
    if(parsed.validationErrors.length)throw Error(parsed.validationErrors.join('\n'));
    await syncNavigation(result); await chrome.storage.local.set({config: result}); return result; });
  writes = next.catch(() => {}); return next;
}
async function open(url, newTab = true) {
  if (!safeUrl(url)) throw Error('Only http and https URLs can be opened.');
  if (newTab) return chrome.tabs.create({url});
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  return chrome.tabs.update(tab.id, {url});
}
async function activate(id) {
  const tab = await chrome.tabs.update(id, {active: true});
  await chrome.windows.update(tab.windowId, {focused: true});
}
async function handle(m, sender) {
  switch (m.type) {
    case 'config': return config();
    case 'shortcuts': return shortcutResults((await config()).shortcuts, String(m.query || ''));
    case 'save': return mutate(() => validateConfig(m.config));
    case 'pin': return mutate(c => {
      if (!safeUrl(m.url)) throw Error('This page cannot be pinned.');
      if (!c.pins.some(p => p.url === safeUrl(m.url))) c.pins.push({id: crypto.randomUUID(), name: (m.name || m.url).slice(0, 200), url: m.url, folder: ''});
      return c;
    });
    case 'current': { const [tab] = await chrome.tabs.query({active: true, currentWindow: true}); return {name: tab.title, url: tab.url}; }
    case 'search': {
      const q = String(m.query || '').trim().slice(0, 500);
      if (!q) return [];
      const [c, tabs, history, bookmarks] = await Promise.all([config(), chrome.tabs.query({}), chrome.history.search({text: q, startTime: 0, maxResults: 150}), q ? chrome.bookmarks.search(q) : Promise.resolve([])]);
      const items = [...c.pins.map(p => ({...p, kind: 'pin'})), ...tabs.filter(t => safeUrl(t.url)).map(t => ({kind: 'tab', id: t.id, name: t.title || t.url, url: t.url})), ...bookmarks.filter(b => safeUrl(b.url)).map(b => ({kind: 'bookmark', name: b.title || b.url, url: b.url})), ...history.filter(h => safeUrl(h.url)).map(h => ({kind: 'history', name: h.title || h.url, url: h.url}))];
      const seen = new Set(); return rank(items, q).filter(x => { if (seen.has(x.url)) return false; seen.add(x.url); return true; });
    }
    case 'go': {
      const c = await config();
      if (m.kind === 'tab') return activate(m.id);
      if (m.url) {
        const tabs = await chrome.tabs.query({});
        const existing = tabs.find(t => t.url === m.url);
        if (existing) return activate(existing.id);
        return open(m.url, m.newTab ?? c.settings.newTab);
      }
      const url = destination(m.query || '');
      if (url) return open(url, m.newTab ?? c.settings.newTab);
      if (!m.query?.trim()) return;
      return chrome.search.query({text: m.query, disposition: (m.newTab ?? c.settings.newTab) ? 'NEW_TAB' : 'CURRENT_TAB'});
    }
    case 'number': { const c = await config(); const p = c.pins[m.index]; if (p) return handle({type: 'go', url: p.url}, sender); return; }
    case 'settings': return chrome.runtime.openOptionsPage();
    default: throw Error('Unknown Titan command.');
  }
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== chrome.runtime.id || message.handler || !message.type) return;
  handle(message, sender).then(value => reply({ok: true, value}), error => reply({ok: false, error: error.message}));
  return true;
});
