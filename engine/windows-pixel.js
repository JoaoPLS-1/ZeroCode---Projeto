// Windows theme: shared challenge engine, selectable on every workstation.
(()=>{
 const base='assets/windows-pixel/';
 const original=ZeroComputer.prototype.open;
 ZeroComputer.prototype.open=function(c){
  this.pixelObserver?.disconnect();
  this.owner.panel.classList.remove('windows-pixel');
  original.call(this,c);
  if(this.record(c.id).os!=='windows')return;
  const p=this.owner.panel,q=s=>p.querySelector(s);
  p.classList.add('windows-pixel');
  q('.pc-workspace aside footer').innerHTML='Windows<br><span>Área de trabalho</span>';
  const icons={'1':'vm','2':'editor','3':'chrome','4':'notes','5':'explorer','6':'notes',folder:'folder'};
  const replace=()=>p.querySelectorAll('img[src*="assets/zeroos/imported/"]').forEach(img=>{
   const key=img.getAttribute('src').split('/').pop().replace('.png','');
   if(icons[key])img.src=base+icons[key]+'.png';
  });
  replace();this.pixelObserver=new MutationObserver(replace);
  this.pixelObserver.observe(p,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
  const label=(selector,icon,name)=>{const b=q(selector);b.innerHTML=`<img src="${base+icon}.png" alt=""><span>${name}</span>`;b.setAttribute('aria-label','Abrir '+name);};
  label('.pc-shortcut','editor','ZeroTrace');label('.zero-vault','notes','ZeroVault');label('.zero-link','chrome','Chrome');
  const info=(title,text)=>{q('.zero-info-title').textContent=title;q('.zero-info div').textContent=text;this.owner.showInfo();};
  q('.zero-link').onclick=()=>info('Chrome · Intranet',c.name+' — conexão local ativa. Portal da equipe: consulte os documentos e as instruções da estação no Explorador de Arquivos.');
  const add=(icon,name,fn)=>{const b=document.createElement('button');b.innerHTML=`<img src="${base+icon}.png" alt=""><span>${name}</span>`;b.onclick=fn;q('.zero-launchers').append(b);};
  add('vm','Máquina virtual',()=>info('Máquina virtual','Ambiente JavaScript isolado desta estação. Abra o ZeroTrace para editar o código e executar os testes da missão.'));
  // O Terminal real é registrado como app em engine/os/apps/terminal.js.
  add('notes','Bloco de notas',()=>{info('Bloco de notas','');const t=document.createElement('textarea');t.className='pixel-notes';t.setAttribute('aria-label','Suas anotações');t.placeholder='Escreva suas pistas aqui…';const r=this.record(c.id);t.value=r.notes||'';t.oninput=()=>r.notes=t.value;q('.zero-info div').append(t);t.focus();});
  add('trash','Lixeira',()=>info('Lixeira','A lixeira está vazia.'));
  q('.pc-start-button').innerHTML='<span class="windows-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span> Iniciar';q('.pc-start-button').setAttribute('aria-label','Abrir menu Iniciar');
  q('.pc-start strong').textContent='Bem-vindo';
 };
})();
