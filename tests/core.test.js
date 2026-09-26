import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults, validateConfig, destination, safeUrl, rank} from '../core.js';

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
