// Final decision: selectable hypotheses and animated D.A.N.I.E.L. dialogue.
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
  this.previousFocus=document.activeElement;this.onDecision=onDecision;this.active=true;this.selected=null;
  this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-labelledby','nexus-title');
  this.root.innerHTML=`<section class="nexus-panel nexus-conversation"><header class="final-top"><span class="final-pixel-chip" aria-hidden="true"></span> ZERO CODE / DECISÃO FINAL</header><div class="final-steps"><span>01 INVESTIGAR</span><i></i><span>02 ANALISAR</span><i></i><strong>03 CONCLUIR</strong></div><aside class="final-kael"><img src="assets/portraits/kael-closed.png" alt="Kael ouvindo Daniel"><span>KAEL / INVESTIGADOR</span></aside>${this.portrait()}<main class="nexus-content"><button class="nexus-close" aria-label="Voltar à investigação">ESC ×</button><h2 id="nexus-title">Qual foi a causa do incidente?</h2><div class="final-bubble"><strong><span class="final-pixel-signal" aria-hidden="true"></span>D.A.N.I.E.L.</strong><p class="nexus-speech" title="Clique para mostrar a fala completa"></p></div><div class="nexus-hypotheses" role="group" aria-label="Hipóteses sobre o incidente"></div><section class="nexus-evidence hidden" aria-label="Evidências coletadas"></section><footer class="nexus-actions"><button class="nexus-review">REVISAR EVIDÊNCIAS</button><button class="nexus-confirm" disabled>✓ CONFIRMAR CONCLUSÃO</button></footer></main></section>`;
  const q=s=>this.root.querySelector(s);this.optionsEl=q('.nexus-hypotheses');
  this.def.options.forEach((opt,i)=>{const b=document.createElement('button');b.className='nexus-option';b.dataset.option=opt.id;b.setAttribute('aria-pressed','false');b.innerHTML='<span class="nexus-option-icon" aria-hidden="true"></span><span class="nexus-option-text"></span><span aria-hidden="true">›</span>';const paths=['<path d="M8 18v-6a8 8 0 0116 0v6M6 18h20v10H6zM16 21v4"/>','<path d="M5 5h22v8H5zM5 19h22v8H5zM9 9h2M9 23h2"/>','<path d="M8 8l16 8-16 8M8 8v16"/><circle cx="8" cy="8" r="3"/><circle cx="24" cy="16" r="3"/><circle cx="8" cy="24" r="3"/>','<path d="M5 25V15h5v10M14 25V9h5v16M23 25V3h5v22"/>'];b.querySelector('.nexus-option-icon').innerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2">'+paths[i%4]+'</svg>';b.querySelector('.nexus-option-text').textContent=opt.text;b.onclick=()=>{this.selected=opt.id;for(const other of this.optionsEl.children)other.setAttribute('aria-pressed',String(other===b));q('.nexus-confirm').disabled=false;};this.optionsEl.append(b);});
  q('.nexus-confirm').onclick=()=>this._choose(this.selected);
  q('.nexus-close').onclick=()=>{this.close();window.__game?._lockInteractions();};
  q('.nexus-review').onclick=()=>{const review=q('.nexus-evidence'),show=review.classList.contains('hidden');review.classList.toggle('hidden',!show);this.optionsEl.classList.toggle('hidden',show);q('.nexus-confirm').classList.toggle('hidden',show);q('.nexus-review').textContent=show?'← VOLTAR À CONCLUSÃO':'REVISAR EVIDÊNCIAS';if(show){review.textContent='';const clues=window.__game?.clues;const found=Object.values(clues?.definitions||{}).filter(c=>clues.hasClue(c.id));if(!found.length)review.textContent='Nenhuma evidência coletada.';for(const clue of found){const article=document.createElement('article');const title=document.createElement('strong');title.textContent=clue.title;article.append(title);const body=document.createElement('p');body.textContent=Array.isArray(clue.body)?clue.body.join('\n'):clue.description||clue.summary||clue.text||'';article.append(body);review.append(article);}}};
  this.root.classList.remove('hidden');this.speak('Vamos conectar as pistas, Kael. Qual é a sua conclusão?',q('.nexus-speech'),q('.nexus-sprite'));this.optionsEl.querySelector('button')?.focus({preventScroll:true});
 }
 _choose(optionId){if(!this.active||!this.def.options.some(o=>o.id===optionId))return;const correct=optionId===this.def.correctOption,result=correct?this.def.results.correct:this.def.results.incorrect,callback=this.onDecision;this.close();callback?.(correct,result);}
 close(){this.stopSpeech();this.active=false;this.root.classList.add('hidden');this.onDecision=null;this.previousFocus?.focus();}
}
if(typeof module!=='undefined')module.exports=MissionSystem;
