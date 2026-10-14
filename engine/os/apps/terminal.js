const ZERO_TERMINAL_APP = {
 id:'terminal',name:'Terminal',icon:'assets/windows-pixel/terminal.png',availableAt:'*',
 open(ctx){
  const term=createTerminal(ctx.fs),body=ctx.window.body;
  body.classList.add('zero-app-terminal');
  const output=document.createElement('div');output.className='terminal-output';output.setAttribute('role','log');output.setAttribute('aria-label','Saída do terminal');
  const form=document.createElement('form');form.className='terminal-command';
  const prompt=document.createElement('label');prompt.className='terminal-prompt';
  const input=document.createElement('input');input.className='terminal-input';input.type='text';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label','Comando do terminal');
  prompt.append(input);form.append(prompt);body.append(output,form);
  const promptText=document.createTextNode('');prompt.prepend(promptText);
  const updatePrompt=()=>{promptText.textContent='kael@'+ctx.station.id+':'+term.cwd+'$ ';};
  const append=lines=>{for(const line of lines){const row=document.createElement('div');row.textContent=line;output.append(row);}output.scrollTop=output.scrollHeight;};
  append(['Bem-vindo ao Terminal do ZeroOS.','Para conhecer os comandos, digite help.']);updatePrompt();
  const history=[];let cursor=0,draft='',busy=false;
  input.onkeydown=event=>{
   if(event.key==='Tab'){event.preventDefault();return;}
   if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;
   event.preventDefault();if(busy)return;
   if(cursor===history.length)draft=input.value;
   cursor=Math.max(0,Math.min(history.length,cursor+(event.key==='ArrowUp'?-1:1)));
   input.value=cursor===history.length?draft:history[cursor];input.setSelectionRange(input.value.length,input.value.length);
  };
  form.onsubmit=async event=>{
   event.preventDefault();if(busy)return;
   const line=input.value;append([promptText.textContent+line]);input.value='';
   if(line.trim())history.push(line);cursor=history.length;draft='';busy=true;input.readOnly=true;
   try{
    const result=await term.run(line);
    if(!body.isConnected)return;
    if(result.clear)output.textContent='';append(result.lines);updatePrompt();
   }finally{busy=false;input.readOnly=false;}
  };
  ctx.window.el.addEventListener('focus',event=>{if(event.target===ctx.window.el)input.focus({preventScroll:true});});
  input.focus({preventScroll:true});
 }
};
registerZeroApp(ZERO_TERMINAL_APP);
if(typeof module!=='undefined')module.exports=ZERO_TERMINAL_APP;
