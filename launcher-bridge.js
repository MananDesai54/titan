import './lib/utils.js';
import * as messenger from './pages/ui_component_messenger.js';
if(new URLSearchParams(location.search).has('embedded')){
  globalThis.titanHide=()=>messenger.postMessage({name:'hide'});
  messenger.registerHandler(async event=>{
    if(event.data.name==='activate')await globalThis.Titan.activate();
  });
  messenger.init();
}
