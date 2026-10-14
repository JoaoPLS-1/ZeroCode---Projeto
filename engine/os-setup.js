// The OS choice changes presentation only. Records and missions are shared.
(()=>{
 const openDesktop=ZeroComputer.prototype.open;
 const windowsLogo='<span class="windows-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
 ZeroComputer.prototype.chooseOS=function(c){
  this.stop();this.pixelObserver?.disconnect();this.owner.windowManager?.destroy();clearInterval(this.owner.osClock);this.owner.osMenuEvents?.abort();closeContextMenu();this.c=c;
  const o=this.owner,p=o.panel,r=this.record(c.id);
  o.focus=document.activeElement;o.g.state='case';o.g.hud.showPrompt(null);
  o.g.input.keys={};o.g.input._justPressed={};
  p.classList.remove('hidden','pc-mode','windows-pixel');p.classList.add('os-setup');
  p.innerHTML=`<section class="os-install" aria-labelledby="os-title">
   <header><span>Instalação do sistema</span><button class="os-leave" aria-label="Sair do computador">×</button></header>
   <div class="os-install-body"><h1 id="os-title">Instalação do sistema</h1><p class="os-station"></p>
   <p class="os-subtitle">Escolha o sistema operacional para continuar.</p>
   <div class="os-options"><button class="os-option os-zero" data-os="zero"><img src="assets/zeroos/imported/1.png" alt=""><strong>ZeroOS</strong><small>Área de trabalho escura.</small><span class="os-install-action">Continuar com ZeroOS</span></button>
   <button class="os-option os-windows" data-os="windows">${windowsLogo}<strong>Windows</strong><small>Área de trabalho clara.</small><span class="os-install-action">Continuar com Windows</span></button></div>
   <footer>Você pode trocar o sistema pelo menu Iniciar sem perder seu progresso.</footer></div></section>`;
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
  p.querySelector('.pc-start-footer').prepend(b);this.owner.setupDesktopApps();
 };
 const close=CaseExperience.prototype.close;
 CaseExperience.prototype.close=function(){this.computer?.pixelObserver?.disconnect();this.panel.classList.remove('os-setup','windows-pixel');close.call(this);};
})();
