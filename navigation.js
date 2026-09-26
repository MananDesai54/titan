(() => {
  let settings={vim:true,scrollStep:100}, hints=[], overlay, prefix='', lastG=0, newTab=false, insertMode=false, modeBadge;
  function setInsertMode(value) {
    insertMode=value;lastG=0;clear();modeBadge?.remove();modeBadge=null;
    if(value){modeBadge=document.createElement('div');modeBadge.style.cssText='position:fixed;bottom:14px;right:14px;z-index:2147483646;pointer-events:none';const shadow=modeBadge.attachShadow({mode:'closed'});const badge=document.createElement('span');badge.textContent='INSERT · Esc to exit';badge.style.cssText='font:12px system-ui;background:#30243d;color:#ecdfff;border:1px solid #a583c3;border-radius:6px;padding:7px 12px';shadow.append(badge);document.documentElement.append(modeBadge);}
  }
  Titan.send('config').then(c=>settings=c.settings).catch(()=>{});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local' && changes.config?.newValue){settings=changes.config.newValue.settings;if(!settings.vim)setInsertMode(false);}});
  function activeElement(){let node=document.activeElement;while(node?.shadowRoot?.activeElement)node=node.shadowRoot.activeElement;return node;}
  function enterInsertMode(e){
    setInsertMode(true);
    if(!editable(e)) [...document.querySelectorAll('input:not([type=hidden]),textarea,[contenteditable="true"],[role="textbox"]')].find(node=>!node.disabled && node.getClientRects().length)?.focus();
  }
  function clear(){overlay?.remove();overlay=null;hints=[];prefix='';}
  function editable(e){return e.composedPath().some(n=>n instanceof Element && (n.matches('input,textarea,select,[role="textbox"],[role="combobox"]') || n.isContentEditable)) || document.designMode==='on';}
  function showHints(inNewTab){
    clear();newTab=inNewTab;
    const targets=[...document.querySelectorAll('a[href],button,input:not([type=hidden]),textarea,select,[role=button],[role=link],[onclick],[tabindex]')].filter(node=>{
      const r=node.getBoundingClientRect(),s=getComputedStyle(node);
      if(node.disabled||node.getAttribute('aria-disabled')==='true'||r.width<1||r.height<1||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth||s.visibility!=='visible'||s.display==='none')return false;
      const hit=document.elementFromPoint(Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)),Math.max(0,Math.min(innerHeight-1,r.top+r.height/2)));
      return hit===node||node.contains(hit);
    });
    if(!targets.length)return;
    overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    const shadow=overlay.attachShadow({mode:'closed'}), alphabet='asdfghjklqwertyuiopzxcvbnm', width=Math.max(1,Math.ceil(Math.log(targets.length)/Math.log(alphabet.length)));
    hints=targets.map((node,i)=>{let code='',n=i;for(let k=0;k<width;k++){code=alphabet[n%alphabet.length]+code;n=Math.floor(n/alphabet.length);}const r=node.getBoundingClientRect(),label=document.createElement('span');label.textContent=code;label.style.cssText=`position:fixed;left:${Math.max(0,r.left)}px;top:${Math.max(0,r.top)}px;background:#f5da88;color:#201707;font:bold 13px monospace;padding:2px 4px;border:1px solid #6b5424;border-radius:3px;box-shadow:0 1px 4px #0008`;shadow.append(label);return {node,code,label};});document.documentElement.append(overlay);
  }
  function scrollTarget(){let node=document.activeElement;while(node && node!==document.body){const s=getComputedStyle(node);if(/auto|scroll/.test(s.overflowY) && node.scrollHeight>node.clientHeight)return node;node=node.parentElement;}return document.scrollingElement;}
  window.addEventListener('keydown',e=>{
    if(Titan.isOpen())return;
    if(e.key==='Escape' && settings.vim){e.preventDefault();e.stopImmediatePropagation();setInsertMode(false);activeElement()?.blur?.();return;}
    if(insertMode || e.defaultPrevented||e.isComposing||e.ctrlKey||e.altKey||e.metaKey)return;
    if(overlay){
      e.preventDefault();e.stopImmediatePropagation();
      if(e.key==='Escape'){clear();return;}
      if(e.key==='Backspace')prefix=prefix.slice(0,-1);else if(/^[a-z]$/i.test(e.key))prefix+=e.key.toLowerCase();else return;
      const matches=hints.filter(h=>h.code.startsWith(prefix));hints.forEach(h=>h.label.style.display=h.code.startsWith(prefix)?'':'none');
      const match=matches.find(h=>h.code===prefix);
      if(match){const node=match.node;clear();if(newTab&&node.matches('a[href]'))Titan.send('go',{url:node.href,newTab:true}).catch(()=>{});else{node.focus();if(!node.matches('input,textarea,select'))node.click();}}
      else if(!matches.length)clear();return;
    }
    if(!settings.vim && editable(e))return;
    if(e.shiftKey&&e.code==='KeyT'){e.preventDefault();e.stopImmediatePropagation();Titan.open();return;}
    if(e.shiftKey&&/^Digit[1-9]$/.test(e.code)){e.preventDefault();e.stopImmediatePropagation();Titan.send('number',{index:Number(e.code.slice(-1))-1}).catch(()=>{});return;}
    if(!settings.vim)return;
    if(e.key==='i'){e.preventDefault();e.stopImmediatePropagation();enterInsertMode(e);return;}
    const target=scrollTarget();if(!target)return;
    const actions={j:()=>target.scrollBy({top:settings.scrollStep}),k:()=>target.scrollBy({top:-settings.scrollStep}),h:()=>target.scrollBy({left:-settings.scrollStep}),l:()=>target.scrollBy({left:settings.scrollStep}),d:()=>target.scrollBy({top:target.clientHeight/2}),u:()=>target.scrollBy({top:-target.clientHeight/2}),G:()=>target.scrollTo({top:target.scrollHeight}),g:()=>{if(Date.now()-lastG<500){target.scrollTo({top:0});lastG=0;}else lastG=Date.now();},f:()=>showHints(false),F:()=>showHints(true)};
    if(e.key!=='g')lastG=0;
    if(actions[e.key]){e.preventDefault();e.stopImmediatePropagation();actions[e.key]();}
    else if(editable(e) && (e.key.length===1 || ['Backspace','Delete','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key))){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  window.addEventListener('scroll',clear,{passive:true});window.addEventListener('resize',clear);
})();
