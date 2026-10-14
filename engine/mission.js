// Três escolhas públicas; confirmação e avaliação ficam no servidor.
class MissionSystem {
 constructor(rootEl,missionDef){this.root=rootEl;this.def=missionDef;this.active=false;this.onDecision=null;this.speechTimer=null;}
 isActive(){return this.active;}
 portrait(){return '<aside class="nexus-portrait"><div class="nexus-sprite" role="img" aria-label="D.A.N.I.E.L., assistente holográfico azul com óculos e barba"></div><div class="nexus-name"><strong>D.A.N.I.E.L.</strong><span>Assistente de investigação</span></div></aside>';}
 stopSpeech(){clearInterval(this.speechTimer);this.speechTimer=null;this.speechPortrait?.classList.remove('mouth-open');this.finishSpeech=null;}
 speak(text,element,portrait){
  this.stopSpeech();this.speechPortrait=portrait;this.speechText=text;element.textContent='';element.setAttribute('aria-label',text);
  let index=0,tick=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.finishSpeech=()=>{element.textContent=text;this.stopSpeech();};
  element.onclick=()=>this.finishSpeech?.();
  if(reduced){this.finishSpeech();return;}
  this.speechTimer=setInterval(()=>{index=Math.min(text.length,index+2);element.textContent=text.slice(0,index);portrait.classList.toggle('mouth-open',Math.floor(tick++/3)%2===0);if(index===text.length)this.finishSpeech?.();},32);
 }
 open(onDecision){
  this.previousFocus=document.activeElement;this.onDecision=onDecision;this.active=true;this.selected={};this.step=0;this.submitting=false;
  this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-labelledby','nexus-title');
  this.root.innerHTML=`<section class="nexus-panel nexus-conversation"><header class="final-top"><span class="final-pixel-chip" aria-hidden="true"></span> ZERO CODE / DECISÃO FINAL</header><div class="final-steps"><span>01 INVESTIGAR</span><i></i><span>02 ANALISAR</span><i></i><strong>03 CONCLUIR</strong></div><aside class="final-kael"><img src="assets/portraits/kael-closed.png" alt="Kael ouvindo Daniel"><span>KAEL / INVESTIGADOR</span></aside>${this.portrait()}<main class="nexus-content"><button class="nexus-close" aria-label="Voltar à investigação">ESC ×</button><h2 id="nexus-title">Como responder ao incidente?</h2><div class="final-bubble"><strong><span class="final-pixel-signal" aria-hidden="true"></span>D.A.N.I.E.L.</strong><p class="nexus-speech" title="Clique para mostrar a fala completa"></p></div><div class="nexus-hypotheses" role="group" aria-label="Ações para responder ao incidente"></div><section class="nexus-evidence hidden" aria-label="Evidências coletadas"></section><footer class="nexus-actions"><button class="nexus-review">REVISAR EVIDÊNCIAS</button><button class="nexus-confirm" disabled>✓ CONFIRMAR CONCLUSÃO</button></footer></main></section>`;
  const q=s=>this.root.querySelector(s);this.optionsEl=q('.nexus-hypotheses');
  q('.nexus-confirm').onclick=()=>{if(this.step<this.def.choices.length-1){this.step++;this.renderChoice();}else this._choose();};
  q('.nexus-close').disabled=false;
  const back=document.createElement('button');back.className='nexus-back';back.textContent='← ESCOLHA ANTERIOR';back.onclick=()=>{if(this.step>0){this.step--;this.renderChoice();}};q('.nexus-actions').append(back);
  q('.nexus-close').onclick=()=>{this.close();window.__game?._lockInteractions();};
  q('.nexus-review').onclick=()=>{const review=q('.nexus-evidence'),show=review.classList.contains('hidden');review.classList.toggle('hidden',!show);this.optionsEl.classList.toggle('hidden',show);q('.nexus-confirm').classList.toggle('hidden',show);q('.nexus-back').classList.toggle('hidden',show);q('.nexus-review').textContent=show?'← VOLTAR À CONCLUSÃO':'REVISAR EVIDÊNCIAS';if(show){review.textContent='';const clues=window.__game?.clues;const found=Object.values(clues?.definitions||{}).filter(c=>clues.hasClue(c.id));if(!found.length)review.textContent='Nenhuma evidência coletada.';for(const clue of found){const article=document.createElement('article');const title=document.createElement('strong');title.textContent=clue.title;article.append(title);const body=document.createElement('p');body.textContent=Array.isArray(clue.body)?clue.body.join('\n'):clue.description||clue.summary||clue.text||'';article.append(body);review.append(article);}}};
  this.root.classList.remove('hidden');this.renderChoice();
 }
 renderChoice(){
  const q=s=>this.root.querySelector(s),choice=this.def.choices[this.step];
  q('#nexus-title').textContent=`${this.step+1}/3 · ${choice.title}`;this.optionsEl.innerHTML='';
  for(const opt of choice.options){
   const b=document.createElement('button');b.className='nexus-option';b.dataset.option=opt.id;b.setAttribute('aria-pressed',String(this.selected[choice.id]===opt.id));b.textContent=opt.text;
   b.onclick=()=>{if(this.submitting)return;this.selected[choice.id]=opt.id;for(const other of this.optionsEl.children)other.setAttribute('aria-pressed',String(other===b));q('.nexus-confirm').disabled=false;};this.optionsEl.append(b);
  }
  q('.nexus-confirm').disabled=!this.selected[choice.id];q('.nexus-confirm').textContent=this.step===2?'✓ CONFIRMAR DECISÃO':'PRÓXIMA ESCOLHA →';
  q('.nexus-back').disabled=this.step===0;
  this.speak(choice.speech,q('.nexus-speech'),q('.nexus-sprite'));this.optionsEl.querySelector('button')?.focus({preventScroll:true});
 }
 async _choose(){
  if(!this.active||this.submitting||!this.def.choices.every(c=>c.options.some(o=>o.id===this.selected[c.id])))return;
  this.submitting=true;const q=s=>this.root.querySelector(s);for(const button of this.root.querySelectorAll('button'))button.disabled=true;
  this.speak('Registrando sua decisão…',q('.nexus-speech'),q('.nexus-sprite'));
  try{
   const response=await api.post('/api/jogo/decisao',{escolhas:{...this.selected}}),callback=this.onDecision;
   this.submitting=false;this.close();callback?.(true,response.resultado);
  }catch(error){
   // Se a resposta se perdeu após o registro, recuperar sem enviar outra decisão.
   try{const saved=await api.get('/api/jogo/decisao/acesso');if(saved.resultado){const callback=this.onDecision;this.submitting=false;this.close();callback?.(true,saved.resultado);return;}}catch{}
   this.submitting=false;for(const button of this.root.querySelectorAll('button'))button.disabled=false;this.renderChoice();this.speak(error.message,q('.nexus-speech'),q('.nexus-sprite'));
  }
 }
 close(){if(this.submitting)return;this.stopSpeech();this.active=false;this.root.classList.add('hidden');this.onDecision=null;this.previousFocus?.focus();}
}
if(typeof module!=='undefined')module.exports=MissionSystem;
