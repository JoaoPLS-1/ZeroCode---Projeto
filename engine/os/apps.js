// Como criar um app: carregue seu script após este arquivo e chame registerZeroApp({
// id, name, icon, availableAt: '*' ou [ids de computadores], requires, open(ctx) }).
// requires usa game.progress.requires (espelho do servidor). open recebe
// { game, computer: ZeroComputer, station, fs: RemoteFS(api, station.id), window }.
// Preencha window.body com DOM; window é o retorno de ZeroWindowManager.open.
// Arquivos são assíncronos e vêm da API; o app nunca concede progresso local.
// Reabrir restaura a janela existente sem executar open(ctx) novamente.
// Estilos do app ficam em ui/zeroos-apps.css, usando as variáveis dos temas do SO.
const ZERO_APPS = [];
function registerZeroApp(def){
 if(!def||typeof def.id!=='string'||!def.id||typeof def.name!=='string'||!def.name||typeof def.icon!=='string'||typeof def.open!=='function'||
  !(def.availableAt==='*'||(Array.isArray(def.availableAt)&&def.availableAt.every(id=>typeof id==='string'))))throw new TypeError('Definição de aplicativo inválida.');
 if(ZERO_APPS.some(app=>app.id===def.id)||['zerotrace','info','explorer'].includes(def.id)||def.id.startsWith('notepad:'))throw new Error('Identificador de aplicativo já reservado.');
 ZERO_APPS.push({...def,availableAt:Array.isArray(def.availableAt)?[...def.availableAt]:def.availableAt});
}

if(typeof ZeroComputer!=='undefined')(()=>{
 const original=ZeroComputer.prototype.open;
 ZeroComputer.prototype.open=function(station){
  const result=original.call(this,station),owner=this.owner,game=owner.g;
  if(game.modo==='rapido')owner.panel.querySelector('.pc-shortcut')?.remove();
  const nav=owner.panel.querySelector('.zero-launchers'),manager=owner.windowManager,events=owner.osMenuEvents;
  if(!nav||!manager||!events||events.signal.aborted)return result;
  const available=app=>(app.availableAt==='*'||app.availableAt.includes(station.id))&&(!app.availableInMode||app.availableInMode(game,station))&&(game.progress.requires(app.requires)||typeof app.openLocked==='function');
  const launch=app=>{
   if(events.signal.aborted||!available(app))return;
   owner.closeStartMenu();
   if(manager.windows.has(app.id)){manager.restore(app.id);return;}
   const win=manager.open({id:app.id,title:app.name,icon:app.icon});
   win.el.classList.add('zero-app-window');
   const ctx={game,computer:this,station,fs:new RemoteFS(api,station.id),window:win};
   const failed=()=>{if(!events.signal.aborted&&manager.windows.get(app.id)?.api===win)win.body.textContent='Não foi possível abrir o aplicativo. Feche a janela e tente novamente.';};
   try{Promise.resolve((game.progress.requires(app.requires)?app.open:app.openLocked).call(app,ctx)).catch(failed);}catch(error){failed();}
  };
  let ids=null;
  const refresh=()=>{
   if(events.signal.aborted)return;
   const apps=ZERO_APPS.filter(available),next=JSON.stringify(apps.map(app=>app.id));
   if(next===ids)return;ids=next;
   nav.querySelectorAll('[data-zero-app]').forEach(button=>button.remove());
   for(const app of apps){
    const button=document.createElement('button');button.dataset.zeroApp=app.id;button.title=app.name;button.setAttribute('aria-label','Abrir '+app.name);
    const icon=document.createElement('img');icon.src=app.icon;icon.alt='';
    const label=document.createElement('span');label.textContent=app.name;button.append(icon,label);button.onclick=()=>launch(app);nav.append(button);
   }
   owner.setupDesktopApps();
  };
  refresh();
  const off=game.progress.on(refresh);events.signal.addEventListener('abort',off,{once:true});
  return result;
 };
})();
if(typeof module!=='undefined')module.exports={ZERO_APPS,registerZeroApp};
