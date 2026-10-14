// Modo de testes: conversar com Dante entrega o passe imediatamente.
class ManagerConversation {
 constructor(game){this.g=game;}
 open(){
  const g=this.g,owned=g.inventory.has('passe_omega');
  if(!owned)g.inventory.add({id:'passe_omega',name:'Passe Ômega',icon:'assets/items/passe-omega.png'});
  g.input.keys={};g.input._justPressed={};g.hud.showPrompt(null);
  const intro=g.dialogsData.dialog_dante;
  g.dialogue.open({...intro,lines:[...intro.lines,{speaker:'npc',text:owned?'Seu Passe Ômega continua válido. A Sala Secreta fica na porta à direita da Gerência.':'Aqui está o Passe Ômega. Ele já está no seu bolso. Use a porta à direita desta sala para acessar a Sala Secreta.'}]},()=>g._lockInteractions());
 }
 cleanup(){}
}
const managerInteract=Game.prototype._interactWith;
Game.prototype._interactWith=function(c){
 if(c.type==='manager'){this.managerConversation??=new ManagerConversation(this);this.managerConversation.open();return;}
 managerInteract.call(this,c);
};
const managerChangeRoom=Game.prototype._changeRoom;
Game.prototype._changeRoom=function(id,spawn){
 if(id==='room_secret'&&!this.inventory.has('passe_omega')){
  this.dialogue.open({kind:'investigation',npcName:'ACESSO RESTRITO · SALA SECRETA',lines:[{text:'É necessário ter o Passe Ômega no inventário. Apenas Dante Kernel pode entregá-lo. Vá ao Café, siga para Reunião e use a porta superior esquerda para entrar na Gerência. Converse com Dante para receber o passe.'}]},()=>this._lockInteractions());return;
 }
 managerChangeRoom.call(this,id,spawn);
};
const managerAdvance=DialogueSystem.prototype.advance;
DialogueSystem.prototype.advance=function(){if(this.managerMode){this.close();return;}managerAdvance.call(this);};
const managerClose=DialogueSystem.prototype.close;
DialogueSystem.prototype.close=function(completed=true){if(this.managerMode)window.__game?.managerConversation?.cleanup();managerClose.call(this,completed);};
// Os PNGs enviados têm fundo preto opaco. Máscara de exibição em memória:
// só remove preto conectado às bordas; os arquivos originais são preservados.
const dantePortraits=new Map();
function dantePortrait(state){
 if(dantePortraits.has(state))return dantePortraits.get(state);
 const task=new Promise(resolve=>{const img=new Image();img.onload=()=>{
  try{
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
   const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),a=pixels.data,w=canvas.width,h=canvas.height;
   const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let read=0,end=0;
   const add=i=>{if(seen[i])return;seen[i]=1;const k=i*4;if(Math.max(a[k],a[k+1],a[k+2])<=16){queue[end++]=i;}};
   for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
   while(read<end){const i=queue[read++];a[i*4+3]=0;const x=i%w;if(x>0)add(i-1);if(x<w-1)add(i+1);if(i>=w)add(i-w);if(i<w*(h-1))add(i+w);}
   // Preserve todo o interior da silhueta, inclusive tecido preto que
   // se conecta ao fundo entre pixels da borda.
   for(let y=0;y<h;y++){let left=0,right=w-1;while(left<w&&a[(y*w+left)*4+3]===0)left++;while(right>=left&&a[(y*w+right)*4+3]===0)right--;for(let x=left;x<=right;x++)a[(y*w+x)*4+3]=255;}
   ctx.putImageData(pixels,0,0);resolve(canvas.toDataURL('image/png'));
  }catch{resolve(img.src);}
 };img.onerror=()=>resolve(img.src);img.src='assets/portraits/dante-'+state+'.png';});
 dantePortraits.set(state,task);return task;
}
const managerPortraitRender=DialogueSystem.prototype._renderPortraits;
DialogueSystem.prototype._renderPortraits=function(isPlayer){
 managerPortraitRender.call(this,isPlayer);
 if(!this.npcName.startsWith('Dante Kernel'))return;
 const img=this.npcSpriteEl.querySelector('img'),state=isPlayer?'closed':'open';img.dataset.danteState=state;
 dantePortrait(state).then(src=>{if(this.active&&this.npcName.startsWith('Dante Kernel')&&img.dataset.danteState===state)img.src=src;});
};
window.addEventListener('DOMContentLoaded',()=>{dantePortrait('open');dantePortrait('closed');});
