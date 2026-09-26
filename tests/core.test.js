import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults, validateConfig, destination, safeUrl, rank, parseShortcuts, shortcutResults} from '../core.js';

test('direct slash shortcuts support labels, punctuation, comments and query parameters', () => {
  const text='# Work\ng!: https://google.com/ Google\n\nstaging_grafana: https://example.com/?client_id=abc%3Adef&state=x Grafana';
  assert.equal(parseShortcuts(text).length,2);
  assert.equal(shortcutResults(text,'/g!')[0].name,'Google');
  assert.equal(shortcutResults(text,'/staging_grafana')[0].url,'https://example.com/?client_id=abc%3Adef&state=x');
  assert.deepEqual(shortcutResults(text,'staging_grafana'),[]);
  assert.equal(shortcutResults(text,'/').length,2);
});
test('shortcut validation rejects malformed lines, duplicates, unsafe URLs and templates', () => {
  for(const text of ['bad line','x: javascript:alert(1)','g: https://google.com/?q=%s','x: https://a.com\nX: https://b.com']) assert.throws(()=>parseShortcuts(text));
  assert.throws(()=>parseShortcuts({}));
});
test('older backups gain empty shortcuts; new shortcuts round trip without changing pins', () => {
  const old=defaults(); delete old.shortcuts;
  assert.equal(validateConfig(old).shortcuts,'');
  const c=defaults();c.shortcuts='claude: https://claude.ai/new/';
  assert.deepEqual(validateConfig(JSON.parse(JSON.stringify(c))),c);
});

test('URL detection keeps search text separate and rejects executable schemes', () => {
  assert.equal(destination('github.com/MananDesai54/titan'), 'https://github.com/MananDesai54/titan');
  assert.equal(destination('brave keyboard shortcuts'), null);
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd', 'chrome://settings']) assert.equal(safeUrl(url), null);
});
test('configuration round trips folders, pins and preferences', () => {
  const c = defaults();
  c.folders.push({id:'work',name:'Work'});
  c.pins.push({id:'repo',name:'Titan',url:'https://github.com/MananDesai54/titan',folder:'work'});
  assert.deepEqual(validateConfig(JSON.parse(JSON.stringify(c))),c);
});
test('import rejects bad schemas, duplicate IDs, orphan pins, unsafe URLs and settings', () => {
  for (const transform of [c=>c.version=2,c=>c.settings.scrollStep=0,c=>c.settings.vim='yes',c=>c.folders=[{id:'a',name:'A'},{id:'a',name:'B'}],c=>c.pins=[{id:'x',name:'X',url:'https://example.com',folder:'missing'}],c=>c.pins=[{id:'x',name:'X',url:'javascript:alert(1)',folder:''}]]) {
    const c=defaults(); transform(c); assert.throws(()=>validateConfig(c));
  }
});
test('search matches all terms across name and URL and prioritizes pins', () => {
  const items=[{name:'Titan',url:'https://github.com/titan',kind:'history'},{name:'Titan',url:'https://github.com/titan',kind:'pin'},{name:'Other',url:'https://example.com',kind:'tab'}];
  assert.deepEqual(rank(items,'titan github').map(x=>x.kind),['pin','history']);
  assert.deepEqual(rank(items,'missing'),[]);
});
