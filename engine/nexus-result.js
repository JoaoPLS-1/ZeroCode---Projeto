// Preserve the existing result actions; NEXUS presents their explanation.
(()=>{
 const show=Game.prototype._showResult;
 Game.prototype._showResult=function(correct,result){
  show.call(this,correct,result);
  const root=this.dom.resultScreen,box=root.querySelector('.overlay-box');root.classList.add('nexus-result');box.classList.add('nexus-panel');
  if(!box.querySelector('.nexus-portrait')){
   const content=document.createElement('main');content.className='nexus-content';while(box.firstChild)content.append(box.firstChild);box.insertAdjacentHTML('afterbegin',this.mission.portrait());box.append(content);
  }
  const body=root.querySelector('.result-body');body.classList.add('nexus-speech');
  this.mission.speak(result.body.join('\n\n'),body,root.querySelector('.nexus-sprite'));
 };
 const finish=Game.prototype._onResultButtonClick;
 Game.prototype._onResultButtonClick=function(){this.mission.stopSpeech();finish.call(this);};
})();
