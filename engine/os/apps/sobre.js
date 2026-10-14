// Demonstração do contrato: apenas informações públicas da estação e do espelho.
const ZERO_ABOUT_APP={
 id:'sobre-zeroos',name:'Sobre o ZeroOS',icon:'assets/zeroos/imported/1.png',availableAt:'*',
 open(ctx){
  const body=ctx.window.body;body.classList.add('zero-app-about');
  const title=document.createElement('h2');title.textContent='Sobre o ZeroOS';
  const details=document.createElement('dl');
  for(const [label,value] of [['Estação',ctx.station.name],['Flags conquistadas',ctx.game.progress.count('flag:')]]){
   const term=document.createElement('dt');term.textContent=label;
   const text=document.createElement('dd');text.textContent=String(value);details.append(term,text);
  }
  body.append(title,details);
 }
};
registerZeroApp(ZERO_ABOUT_APP);
if(typeof module!=='undefined')module.exports=ZERO_ABOUT_APP;
