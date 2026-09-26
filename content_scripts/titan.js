// Titan uses Vimium's authenticated iframe transport and keyboard mode stack.
const TitanLauncher = {
  component:null,
  activate(sourceFrameId) {
    HelpDialog.abort();
    if(!this.component){
      this.component=new UIComponent();
      this.component.load('launcher.html?embedded=1','titan-frame');
    }
    this.component.show({name:'activate'},{sourceFrameId,focus:true});
  },
};
NormalModeCommands['Titan.activate']=TitanLauncher.activate.bind(TitanLauncher);
for(let i=1;i<=9;i++)NormalModeCommands[`Titan.pin${i}`]=()=>chrome.runtime.sendMessage({type:'number',index:i-1});
// Custom legacy launcher mappings also open the single Titan interface.
for(const name of Object.keys(NormalModeCommands))if(name.startsWith('Vomnibar.'))NormalModeCommands[name]=TitanLauncher.activate.bind(TitanLauncher);
globalThis.TitanLauncher=TitanLauncher;
