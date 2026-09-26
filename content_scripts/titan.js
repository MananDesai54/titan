const TitanLauncher = {
  activate(sourceFrameId) {
    // Titan's launcher is an Arc-style switcher: selecting anything should preserve
    // the current page and open the destination in a new tab.
    // Vomnibar.activate receives a Vimium registry entry, so launcher options must
    // be nested under `options` for its wrapper to preserve them.
    Vomnibar.activate(sourceFrameId, {options: {newTab: true}});
  },
};
NormalModeCommands['Titan.activate']=TitanLauncher.activate.bind(TitanLauncher);
for(let i=1;i<=9;i++)NormalModeCommands[`Titan.pin${i}`]=()=>chrome.runtime.sendMessage({type:'number',index:i-1});
// Existing Vimium launcher mappings also use the unified Titan/Vomnibar surface.
for(const name of Object.keys(NormalModeCommands))if(name.startsWith('Vomnibar.'))NormalModeCommands[name]=TitanLauncher.activate.bind(TitanLauncher);
globalThis.TitanLauncher=TitanLauncher;
