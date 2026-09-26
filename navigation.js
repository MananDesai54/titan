(() => {
  let settings={vim:true,scrollStep:100}, hints=[], overlay, prefix='', lastG=0, newTab=false;
  Titan.send('config').then(c=>settings=c.settings).catch(()=>{});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local' && changes.config?.newValue)settings=changes.config.newValue.settings;});
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
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||Titan.isOpen())return;
    if(overlay){
      e.preventDefault();e.stopImmediatePropagation();
      if(e.key==='Escape'){clear();return;}
      if(e.key==='Backspace')prefix=prefix.slice(0,-1);else if(/^[a-z]$/i.test(e.key))prefix+=e.key.toLowerCase();else return;
      const matches=hints.filter(h=>h.code.startsWith(prefix));hints.forEach(h=>h.label.style.display=h.code.startsWith(prefix)?'':'none');
      const match=matches.find(h=>h.code===prefix);
      if(match){const node=match.node;clear();if(newTab&&node.matches('a[href]'))Titan.send('go',{url:node.href,newTab:true}).catch(()=>{});else{node.focus();if(!node.matches('input,textarea,select'))node.click();}}
      else if(!matches.length)clear();return;
    }
    if(editable(e))return;
    if(e.shiftKey&&e.code==='KeyT'){e.preventDefault();e.stopImmediatePropagation();Titan.open();return;}
    if(e.shiftKey&&/^Digit[1-9]$/.test(e.code)){e.preventDefault();e.stopImmediatePropagation();Titan.send('number',{index:Number(e.code.slice(-1))-1}).catch(()=>{});return;}
    if(!settings.vim)return;
    const target=scrollTarget();if(!target)return;
    const actions={j:()=>target.scrollBy({top:settings.scrollStep}),k:()=>target.scrollBy({top:-settings.scrollStep}),h:()=>target.scrollBy({left:-settings.scrollStep}),l:()=>target.scrollBy({left:settings.scrollStep}),d:()=>target.scrollBy({top:target.clientHeight/2}),u:()=>target.scrollBy({top:-target.clientHeight/2}),G:()=>target.scrollTo({top:target.scrollHeight}),g:()=>{if(Date.now()-lastG<500){target.scrollTo({top:0});lastG=0;}else lastG=Date.now();},f:()=>showHints(false),F:()=>showHints(true)};
    if(e.key!=='g')lastG=0;
    if(actions[e.key]){e.preventDefault();e.stopImmediatePropagation();actions[e.key]();}
  },true);
  window.addEventListener('scroll',clear,{passive:true});window.addEventListener('resize',clear);
})();
