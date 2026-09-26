(() => {
  const extensionPage = location.protocol === 'chrome-extension:';
  const settingsPage = extensionPage && location.pathname.endsWith('settings.html');
  let host, root, panel, input, list, status, config, modal, rows = [], selected = 0, generation = 0, previousFocus, pendingSearch = Promise.resolve();
  const send = async (type, args = {}) => {
    const result = await chrome.runtime.sendMessage({type, ...args});
    if (!result?.ok) throw Error(result?.error || 'Titan is unavailable. Reload this page after updating the extension.');
    return result.value;
  };
  const el = (tag, text, attrs = {}) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };
  const button = (text, action) => {
    const b = el('button', text, {type: 'button'});
    b.addEventListener('click', () => Promise.resolve().then(action).catch(report)); return b;
  };
  function report(error) { if (status) status.textContent = error.message || String(error); }
  const css = `
    dialog{position:fixed;inset:0;margin:0;width:100vw;height:100vh;max-width:none;max-height:none;padding:0;border:0;background:transparent;color:inherit}dialog::backdrop{background:transparent}
    .results.search-results{max-height:min(340px,52vh);padding:0 10px}.search-results .row{height:68px;margin:0}
    textarea{display:block;width:100%;min-height:260px;resize:vertical;border:1px solid #51485e;border-radius:8px;background:#14111b;color:#efedf8;padding:14px;font:13px/1.7 monospace;box-sizing:border-box}textarea:focus{outline:2px solid #bca0ec}
    :host{all:initial;color-scheme:dark;font:15px/1.5 system-ui,sans-serif;color:#efedf8}
    *{box-sizing:border-box} .backdrop{position:fixed;inset:0;background:#080710ac;display:flex;justify-content:center;align-items:flex-start;padding:9vh 18px;z-index:2147483647}
    .page{min-height:100vh;padding:7vh 18px;background:radial-gradient(ellipse at top,#32283c,#111018 65%);display:flex;justify-content:center}
    .panel{width:720px;max-width:100%;background:#1b1924;border:1px solid #494052;border-radius:20px;box-shadow:0 24px 90px #0007;overflow:hidden;align-self:flex-start}
    .settings{width:900px;padding:28px}.popup{padding:10px;min-height:590px}.popup .panel{box-shadow:none}
    header{display:flex;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid #ffffff12}h1{font-size:22px;letter-spacing:4px;margin:0}h2{font-size:18px;margin:26px 0 12px}p{color:#b9b2ca;margin:8px 0 16px}
    header span{flex:1;color:#b9b2ca;font-size:12px}input,select,button{font:inherit;color:inherit;border:1px solid #51485e;background:#262130;border-radius:8px;padding:8px 11px}button{cursor:pointer}button:hover,button:focus-visible{background:#42314f;outline:2px solid #bca0ec}input:focus,select:focus{outline:2px solid #bca0ec}input[type=checkbox]{accent-color:#c5a7ee}
    .query{display:block;border:0;border-radius:0;width:100%;padding:22px;background:transparent;font-size:20px;outline:none!important}.results{max-height:52vh;overflow:auto;padding:0 10px 10px}.row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;margin:3px 0;padding:12px}.row.active{background:#393044;outline:1px solid #887098}.row .body{flex:1;min-width:0}.row strong,.row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.row small{color:#b6acc4;font-size:12px}.badge{font-size:11px;color:#d2b8f6;border:1px solid #665373;border-radius:5px;padding:2px 6px}footer{padding:12px 22px;color:#aaa1bb;font-size:12px;border-top:1px solid #ffffff12}.status{padding:0 22px;color:#f3c894;white-space:pre-wrap}.group{padding:12px 12px 4px;font-size:11px;letter-spacing:2px;color:#b9a5d4;text-transform:uppercase}.line{display:flex;gap:8px;align-items:center;margin:10px 0;flex-wrap:wrap}.line input:not([type=checkbox]){flex:1;min-width:120px}.pin-edit{padding:12px 0;border-bottom:1px solid #ffffff13}.pin-edit input{width:180px}label{display:block;margin:12px 0}label input{margin-right:10px}a{color:#cfb5ed}.hint{color:#b9b2ca;font-size:13px}kbd{font:12px monospace;background:#3b3247;padding:2px 5px;border-radius:4px}
  `;
  function mount() {
    previousFocus = document.activeElement;
    host = el('div');
    host.style.cssText = extensionPage ? 'display:block' : 'position:fixed;inset:0;z-index:2147483647;';
    root = host.attachShadow({mode: 'closed'});
    root.append(el('style', css));
    const backdrop = el('div', undefined, {class: extensionPage ? `page ${location.pathname.endsWith('popup.html') ? 'popup' : ''}` : 'backdrop'});
    panel = el('section', undefined, {class: `panel${settingsPage ? ' settings' : ''}`, role: 'dialog', 'aria-label': settingsPage ? 'Titan settings' : 'Titan command bar', 'aria-modal': 'true'});
    backdrop.append(panel);
    if (!extensionPage) { modal=el('dialog',undefined,{'aria-label':'Titan command bar'}); modal.append(backdrop); root.append(modal); }
    else root.append(backdrop);
    document.documentElement.append(host);
    if (modal && !extensionPage) { modal.addEventListener('cancel',e=>{e.preventDefault();close();}); modal.showModal(); }
    backdrop.addEventListener('click', e => { if (e.target === backdrop && !extensionPage) close(); });
    root.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !settingsPage) { e.preventDefault(); close(); }
      if (e.key === 'Tab' && !extensionPage) {
        const focusable = [...root.querySelectorAll('button,input,select,a[href]')].filter(x => !x.disabled);
        const first = focusable[0], last = focusable.at(-1);
        if (e.shiftKey && root.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && root.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
      e.stopPropagation();
    });
  }
  // The modal makes the underlying page inert. Capture launcher keys before
  // document-level site handlers, while retaining native text-input defaults.
  window.addEventListener('keydown',e=>{
    if (!host || extensionPage) return;
    if (root.activeElement === input) inputKeydown(e);
    if (e.key === 'Escape') {e.preventDefault();close();}
    e.stopImmediatePropagation();
  },true);
  for (const type of ['keyup','keypress']) window.addEventListener(type,e=>{if(host && !extensionPage)e.stopImmediatePropagation();},true);
  function close() {
    generation++;
    if (extensionPage) { if (location.pathname.endsWith('popup.html')) window.close(); else { input.value = ''; refresh(); input.focus(); } return; }
    modal?.close(); modal=null; host?.remove(); host = null; previousFocus?.focus?.();
  }
  async function open() {
    if (host) { input?.focus(); return; }
    mount();
    const header = el('header'); header.append(el('h1', 'TITAN'), el('span', 'A place for every orbit.'), button('Settings', () => send('settings'))); panel.append(header);
    input = el('input', undefined, {class:'query', placeholder:'Search history, tabs, bookmarks… or /', 'aria-label':'Search Titan', role:'combobox', 'aria-autocomplete':'list', 'aria-controls':'titan-results', 'aria-expanded':'true', autocomplete:'off'});
    list = el('div', undefined, {class:'results', id:'titan-results', role:'listbox', 'aria-label':'Results'});
    status = el('p', '', {class:'status', role:'status'});
    panel.append(input, list, status, el('footer', '↑ ↓ navigate · Enter open · / shortcuts · Esc close · Shift+1–9 pins'));
    input.addEventListener('input', () => { render([]); status.textContent='Searching…'; pendingSearch=refresh().catch(report); });
    input.addEventListener('keydown', inputKeydown);
    input.focus();
    pendingSearch=refresh().catch(report); await pendingSearch;
  }
  function inputKeydown(e) {
      if (e.isComposing) return;
      if (['ArrowDown','ArrowUp'].includes(e.key)) { e.preventDefault(); selected = (selected + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % (rows.length || 1); highlight(); }
      if (e.key === 'Enter') { e.preventDefault(); const query=input.value; pendingSearch.then(()=>{if(host && input.value===query)run(rows[selected]);}); }
      if (!input.value && e.shiftKey && /^Digit[1-9]$/.test(e.code) && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); send('number', {index:Number(e.code.slice(-1))-1}).then(close).catch(report); }

  }
  function highlight() {
    [...list.querySelectorAll('.row')].forEach((node, i) => { node.classList.toggle('active', i === selected); node.setAttribute('aria-selected', String(i === selected)); if (i === selected) { input.setAttribute('aria-activedescendant', node.id); node.scrollIntoView({block:'nearest'}); } });
  }
  async function run(row) {
    if (!row) return;
    try { if (row.action) await row.action(); else { await send('go', row); close(); } } catch(e) { report(e); }
  }
  async function refresh() {
    const revision = ++generation, q = input.value.trim();
    const c = await send('config');
    let next = [];
    if (q.startsWith('/')) {
      next = [
        {name:'Pin this page', url:'Save the current page to your pins', kind:'command', action:async () => { const current = await send('current'); await send('pin', current); input.value=''; await refresh(); status.textContent='Page pinned. Organize it in Settings.'; }},
        {name:'Create folder', url:'Manage folders and pins in Settings', kind:'command', action:() => send('settings')},
        {name:'Settings', url:'Preferences, pins, folders, import and export', kind:'command', action:() => send('settings')},
        {name:'Export configuration', url:'Download pins, folders and preferences as JSON', kind:'command', action:async () => exportConfig(await send('config'))},
        ...c.pins.map((p,i) => ({...p, kind:'pin', label:i < 9 ? `⇧${i+1}` : 'pin'})),
        ...c.folders.map(f => ({name:f.name, url:'Browse folder', kind:'folder', action:() => { input.value=''; render(c.pins.filter(p => p.folder === f.id).map(p => ({...p,kind:'pin'}))); }}))
      ].filter(r => r.name.toLowerCase().includes(q.slice(1).toLowerCase()));
      const shortcuts = await send('shortcuts', {query:q});
      next.unshift(...shortcuts.map(s=>({...s, name:`/${s.alias}${s.name !== s.alias ? ` · ${s.name}` : ''}`})));
    } else if (!q) {
      const pinRow = p => {const i=c.pins.findIndex(x=>x.id===p.id);return {...p,kind:'pin',label:i<9?`⇧${i+1}`:'pin',group:c.folders.find(f=>f.id===p.folder)?.name || 'Pinned'};};
      next = c.pins.filter(p=>!p.folder).map(pinRow);
      for (const folder of c.folders) {
        const pins=c.pins.filter(p=>p.folder===folder.id);
        if (pins.length) next.push(...pins.map(pinRow));
        else next.push({name:folder.name,url:'Empty folder · add pins in Settings',kind:'folder',group:'Folders',action:()=>send('settings')});
      }
      if (!next.length) status.textContent = 'Your space starts here. Type / to pin a page or create a folder.';
    } else {
      next = await send('search', {query:q});
      next.push({name:`Search or open “${q}”`, url:'Use your browser’s default search engine', kind:'search', query:q});
      // A search action has a descriptive subtitle, not a navigation URL.
      next[next.length-1].subtitle = next[next.length-1].url; delete next[next.length-1].url;
    }
    if (revision !== generation || !host) return;
    list.classList.toggle('search-results', !!q && !q.startsWith('/'));
    status.textContent=next.length ? '' : (q ? 'No matching shortcuts.' : 'Your space starts here. Type / to pin a page or create a folder.'); render(next);
  }
  function render(next) {
    rows = next; selected = 0; list.replaceChildren(); input.removeAttribute('aria-activedescendant');
    let group;
    next.forEach((r,i) => {
      if (r.group && group !== r.group) { group=r.group; list.append(el('div',group,{class:'group'})); }
      const b = button('', () => run(r)); b.className='row'; b.id=`titan-result-${i}`; b.setAttribute('role','option'); b.tabIndex=-1;
      const body=el('span',undefined,{class:'body'}); body.append(el('strong',r.name),el('small',r.subtitle || r.url));
      b.append(body,el('span',r.label || r.kind,{class:'badge'})); list.append(b);
    }); highlight();
  }
  function exportConfig(c) {
    const url=URL.createObjectURL(new Blob([JSON.stringify(c,null,2)],{type:'application/json'}));
    const link=el('a',undefined,{href:url,download:'titan-config.json'}); root.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function settings() {
    mount(); config=await send('config'); drawSettings();
  }
  function field(value, placeholder) { return el('input',undefined,{value,placeholder,'aria-label':placeholder}); }
  function drawSettings() {
    panel.replaceChildren(el('h1','TITAN'),el('p','Your browser, in your orbit. All settings save on this device.'));
    status=el('p','',{class:'status',role:'status'});
    panel.append(el('h2','Navigation'));
    for (const [key,text] of [['vim','Enable Vim navigation and link hints'],['newTab','Open searches and new destinations in a new tab']]) {
      const label=el('label'); const check=el('input',undefined,{type:'checkbox'}); check.checked=config.settings[key]; check.onchange=()=>config.settings[key]=check.checked; label.append(check,document.createTextNode(text)); panel.append(label);
    }
    const stepLabel=el('label','Scroll distance (20–1000 pixels) '), step=field(config.settings.scrollStep,'Scroll distance'); step.type='number'; step.min='20'; step.max='1000'; step.oninput=()=>config.settings.scrollStep=Number(step.value); stepLabel.append(step); panel.append(stepLabel);
    panel.append(el('p','Normal mode is the default, including in focused textboxes. Press i to enter insert mode and type on the page; Esc returns to normal mode. Titan’s own search box always accepts typing. Shift+T opens Titan in normal mode; Shift+1–9 opens pins. j/k/h/l scroll; d/u scroll half a page; gg/G jump to top/bottom; f shows link hints; Shift+F opens hinted links in a new tab.',{class:'hint'}));
    panel.append(el('p','Disabling Vim navigation restores normal textbox typing. On restricted pages or while the address bar has focus, use Alt+T or the Titan toolbar button. Change Alt+T in brave://extensions/shortcuts.',{class:'hint'}));
    panel.append(el('p','Titan preserves Brave’s new-tab page. Use Alt+T or the toolbar button there; Brave does not allow webpage shortcuts such as Shift+T on its native new-tab page.',{class:'hint'}));
    panel.append(el('h2','Custom / shortcuts'),el('p','One shortcut per line: name: URL Optional label. These only appear under / in Titan and open the saved URL. No search templates or %s. Blank lines and # comments are allowed.',{class:'hint'}));
    const shortcuts=el('textarea',undefined,{'aria-label':'Custom slash shortcuts',spellcheck:'false',placeholder:'chatgpt: https://chatgpt.com/\nclaude: https://claude.ai/new/\ng!: https://www.google.com/ Google'});
    shortcuts.value=config.shortcuts || '';shortcuts.oninput=()=>config.shortcuts=shortcuts.value;panel.append(shortcuts);
    panel.append(el('h2','Folders'));
    config.folders.forEach(f=>{const line=el('div',undefined,{class:'line'}), name=field(f.name,'Folder name'); name.oninput=()=>f.name=name.value; line.append(name,button('Delete',()=>{config.folders=config.folders.filter(x=>x.id!==f.id); config.pins.forEach(p=>{if(p.folder===f.id)p.folder='';});drawSettings();}));panel.append(line);});
    panel.append(button('+ Add folder',()=>{config.folders.push({id:crypto.randomUUID(),name:'New folder'});drawSettings();}));
    panel.append(el('h2','Pins'),el('p','The order below determines Shift+1–9, including pins inside folders. Changes take effect when you save.',{class:'hint'}));
    config.pins.forEach((p,i)=>{
      const line=el('div',undefined,{class:'line pin-edit'}), name=field(p.name,'Pin name'), url=field(p.url,'https://example.com'), folder=el('select',undefined,{'aria-label':'Pin folder'});
      folder.append(el('option','No folder',{value:''})); config.folders.forEach(f=>folder.append(el('option',f.name,{value:f.id}))); folder.value=p.folder;
      name.oninput=()=>p.name=name.value;url.oninput=()=>p.url=url.value;folder.onchange=()=>p.folder=folder.value;
      const move=direction=>{const target=i+direction;if(target<0||target>=config.pins.length)return;[config.pins[i],config.pins[target]]=[config.pins[target],config.pins[i]];drawSettings();};
      line.append(el('span',i<9?`⇧${i+1}`:`${i+1}`),name,url,folder,button('↑',()=>move(-1)),button('↓',()=>move(1)),button('Remove',()=>{config.pins.splice(i,1);drawSettings();}));panel.append(line);
    });
    panel.append(button('+ Add pin',()=>{config.pins.push({id:crypto.randomUUID(),name:'New pin',url:'https://',folder:''});drawSettings();}));
    panel.append(el('h2','Backup & restore'),el('p','Export includes saved shortcuts, pins, folders and preferences. It does not include your browsing history. Import replaces this page’s draft; review it and Save settings to apply.',{class:'hint'}));
    const file=el('input',undefined,{type:'file',accept:'.json,application/json','aria-label':'Import Titan configuration'});
    file.onchange=async()=>{try{const chosen=file.files[0];if(!chosen)return;if(chosen.size>2_000_000)throw Error('Configuration file is too large.');const data=JSON.parse(await chosen.text());const {validateConfig}=await import(chrome.runtime.getURL('core.js'));config=validateConfig(data);drawSettings();status.textContent='Imported into draft. Review and Save settings to apply.';}catch(e){report(e);}};
    panel.append(button('Export saved configuration',async()=>exportConfig(await send('config'))),file);
    const actions=el('div',undefined,{class:'line'});actions.append(button('Save settings',async()=>{config=await send('save',{config});drawSettings();status.textContent='Settings saved.';}),button('Discard changes',async()=>{config=await send('config');drawSettings();}));panel.append(el('h2','Save'),actions,status);
  }
  globalThis.Titan = {open, send, isOpen:()=>!!host};
  if(extensionPage) { (settingsPage?settings():open()).catch(report); }
})();
