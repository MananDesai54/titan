const TitanLauncher = {
  activate(sourceFrameId) {
    Vomnibar.activate(sourceFrameId, {});
  },
};
NormalModeCommands['Titan.activate']=TitanLauncher.activate.bind(TitanLauncher);
for(let i=1;i<=9;i++)NormalModeCommands[`Titan.pin${i}`]=()=>chrome.runtime.sendMessage({type:'number',index:i-1});
// Existing Vimium launcher mappings also use the unified Titan/Vomnibar surface.
for(const name of Object.keys(NormalModeCommands))if(name.startsWith('Vomnibar.'))NormalModeCommands[name]=TitanLauncher.activate.bind(TitanLauncher);
globalThis.TitanLauncher=TitanLauncher;
