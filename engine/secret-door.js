// O painel envia a tentativa; apenas o estado devolvido pela API concede acesso.
class SecretDoor {
  constructor(game){this.g=game;}
  open(spawn){
    if(this.root)return;
    const g=this.g,root=document.createElement('div');
    this.root=root;this.focus=document.activeElement;g.state='secret-door';
    g.input.keys={};g.input._justPressed={};g.hud.showPrompt(null);
    root.className='secret-door-overlay';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','secret-door-title');
    root.innerHTML='<form class="secret-door-card"><h2 id="secret-door-title"></h2><p class="secret-door-instruction"></p><label for="secret-door-ip">IP de origem</label><input id="secret-door-ip" type="text" inputmode="decimal" maxlength="15" autocomplete="off" required><label for="secret-door-port">Porta</label><input id="secret-door-port" type="number" min="1" max="65535" step="1" required><p class="secret-door-status" role="status" aria-live="polite"></p><div class="secret-door-actions"><button type="button">Fechar (Esc)</button><button type="submit">Conectar</button></div></form>';
    root.querySelector('h2').textContent=SECRET_DOOR.title;
    root.querySelector('.secret-door-instruction').textContent=SECRET_DOOR.instruction;
    const form=root.querySelector('form'),ip=root.querySelector('#secret-door-ip'),port=root.querySelector('#secret-door-port'),status=root.querySelector('.secret-door-status'),connect=root.querySelector('[type="submit"]');
    root.querySelector('[type="button"]').onclick=()=>this.close();
    form.onsubmit=async event=>{
      event.preventDefault();if(connect.disabled)return;connect.disabled=true;status.textContent='Conectando…';
      try{
        const result=await api.post('/api/jogo/porta-secreta',{ip:ip.value.trim(),porta:Number(port.value)});
        if(this.root!==root)return;
        g.progress.sincronizar(result);
        if(!result.ok||!g.progress.has('acesso:sala-secreta')){status.textContent=SECRET_DOOR.refused;return;}
        this.close();
        g.dialogue.open(SECRET_DOOR.accepted,()=>g._changeRoom('room_secret',spawn));
      }catch(error){if(this.root===root)status.textContent=error.message;}
      finally{connect.disabled=false;}
    };
    this.keyHandler=event=>{
      if(event.code==='F11')return;
      event.stopImmediatePropagation();
      if(event.code==='Escape'){event.preventDefault();this.close();return;}
      if(event.key==='Tab'){
        const fields=[...root.querySelectorAll('input,button')].filter(el=>!el.disabled);
        const index=fields.indexOf(document.activeElement);
        if(index<0||(!event.shiftKey&&index===fields.length-1)||(event.shiftKey&&index===0)){
          event.preventDefault();fields[event.shiftKey?fields.length-1:0].focus();
        }
      }
    };
    window.addEventListener('keydown',this.keyHandler,true);
    g.canvas.parentElement.append(root);ip.focus();
  }
  close(){
    if(!this.root)return;
    window.removeEventListener('keydown',this.keyHandler,true);this.root.remove();this.root=null;
    this.g.state='playing';this.g.input.keys={};this.g.input._justPressed={};this.g._lockInteractions();this.focus?.focus();
  }
}
if (typeof module !== 'undefined') module.exports = SecretDoor;
