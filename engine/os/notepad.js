// Read-only documents share the workstation window lifecycle.
class ZeroNotepad {
 static open(manager,{id,name,text,icon='assets/zeroos/imported/6.png'}){
  const content=document.createElement('div');content.className='os-notepad';
  const documentText=document.createElement('pre');documentText.className='os-notepad-text';documentText.tabIndex=0;documentText.textContent=text;
  const footer=document.createElement('footer');footer.className='os-notepad-actions';content.append(documentText,footer);
  const api=manager.open({id:'notepad:'+id,title:name+' — Bloco de notas',icon,width:680,height:520,content});
  api.body.parentElement.classList.add('os-notepad-window');
  return {action(label,fn){const actions=api.body.querySelector('.os-notepad-actions');actions.textContent='';const b=document.createElement('button');b.textContent=label;b.onclick=fn;actions.append(b);}};
 }
}
if(typeof module!=='undefined')module.exports=ZeroNotepad;
