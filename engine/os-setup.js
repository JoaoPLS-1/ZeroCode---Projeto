// The OS choice changes presentation only. Records and missions are shared.
(()=>{
 const openDesktop=ZeroComputer.prototype.open;
 const windowsLogo='<span class="windows-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
 ZeroComputer.prototype.chooseOS=function(c){
  this.stop();this.pixelObserver?.disconnect();this.c=c;
  const o=this.owner,p=o.panel,r=this.record(c.id);
  o.focus=document.activeElement;o.g.state='case';o.g.hud.showPrompt(null);
  o.g.input.keys={};o.g.input._justPressed={};
  p.classList.remove('hidden','pc-mode','windows-pixel');p.classList.add('os-setup');
  p.innerHTML=`<section class="os-install" aria-labelledby="os-title">
   <header><span><b class="setup-led"></b> ZERO CODE / CONFIGURAÇÃO DA ESTAÇÃO</span><button class="os-leave" aria-label="Sair do computador">ESC ×</button></header>
   <div class="os-install-body"><div class="os-step"><span>01 PREPARAR</span><i></i><span class="os-step-current">02 ESCOLHER SISTEMA</span><i></i><span>03 INVESTIGAR</span></div>
   <p class="os-ready">✓ ESTAÇÃO PRONTA</p><h1 id="os-title">${r.os?'Seu computador. Seu estilo':'Computador recém-formatado'}</h1>
   <p class="os-subtitle">Qual sistema operacional você deseja utilizar?</p><p class="os-station"></p>
   <div class="os-options"><button class="os-option os-zero" data-os="zero"><img src="assets/zeroos/imported/1.png" alt=""><span class="os-option-type">SISTEMA ZERO CODE</span><strong>Zero Code</strong><small>Ambiente original da investigação.<br>Visual tecnológico em azul e roxo.</small><span class="os-install-action">USAR ZERO CODE <b>→</b></span></button>
   <button class="os-option os-windows" data-os="windows">${windowsLogo}<span class="os-option-type">ÁREA DE TRABALHO CLÁSSICA</span><strong>Windows</strong><small>Um ambiente familiar.<br>Janelas e ícones em pixel art.</small><span class="os-install-action">USAR WINDOWS <b>→</b></span></button></div>
   <footer><span>Mesmos arquivos. Mesmo desafio. Escolha o seu visual.</span><small>Você pode trocar o sistema depois, sem perder seu progresso.</small></footer></div></section>`;
  p.querySelector('.os-station').textContent=c.name;
  p.querySelector('.os-leave').onclick=()=>o.close();
  for(const button of p.querySelectorAll('[data-os]')){
   button.setAttribute('aria-pressed',String(button.dataset.os===r.os));
   button.onclick=()=>{r.os=button.dataset.os;this.open(c);};
  }
  p.querySelector(r.os?`[data-os="${r.os}"]`:'[data-os]').focus({preventScroll:true});p.scrollTop=0;
 };
 ZeroComputer.prototype.open=function(c){
  if(!this.record(c.id).os){this.chooseOS(c);return;}
  this.owner.panel.classList.remove('os-setup');
  openDesktop.call(this,c);
  const p=this.owner.panel,b=document.createElement('button');
  b.className='pc-switch-os';b.textContent='Trocar sistema';b.onclick=()=>this.chooseOS(c);
  p.querySelector('.pc-start').append(b);
  // Keep a visible shortcut so changing the style is easy to discover.
  const shortcut=b.cloneNode(true);shortcut.onclick=b.onclick;
  p.querySelector('.pc-taskbar').insertBefore(shortcut,p.querySelector('.pc-disconnect'));
 };
 const close=CaseExperience.prototype.close;
 CaseExperience.prototype.close=function(){this.computer?.pixelObserver?.disconnect();this.panel.classList.remove('os-setup','windows-pixel');close.call(this);};
})();
