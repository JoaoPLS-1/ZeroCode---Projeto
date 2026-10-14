// Ferramenta local: transforma somente o texto fornecido pelo jogador.
function cesar(texto, n) {
 if(!Number.isInteger(n))throw new TypeError('O deslocamento deve ser inteiro.');
 const shift=((n%26)+26)%26;
 return String(texto).replace(/[A-Za-z]/g,char=>{
  const base=char>='a'&&char<='z'?97:65;
  return String.fromCharCode(base+(char.charCodeAt(0)-base+shift)%26);
 });
}
const ZERO_CESAR_APP = {
 id:'cesar',name:'Roda de César',icon:'assets/zeroos/vault.svg',availableAt:'*',
 open(ctx){
  const body=ctx.window.body;body.classList.add('zero-app-cesar');
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const intro=make('p',null,'A cifra de César desloca cada letra no alfabeto. Para desfazer uma cifra, use o deslocamento oposto. Espaços, pontuação e números permanecem iguais.');
  const sourceLabel=make('label',null,'Texto de entrada'),source=make('textarea');source.rows=4;source.spellcheck=false;source.setAttribute('aria-label','Texto de entrada');sourceLabel.append(source);
  const controls=make('div','cesar-controls'),shiftLabel=make('label',null,'Deslocamento '),shift=make('select');shift.setAttribute('aria-label','Deslocamento');
  for(let n=-25;n<=25;n++){const option=make('option',null,n>0?'+'+n:String(n));option.value=String(n);shift.append(option);}shift.value='0';shiftLabel.append(shift);
  const minus=make('button',null,'−'),plus=make('button',null,'+');minus.type=plus.type='button';minus.setAttribute('aria-label','Diminuir deslocamento');plus.setAttribute('aria-label','Aumentar deslocamento');controls.append(minus,shiftLabel,plus);
  const outputLabel=make('label',null,'Resultado'),output=make('textarea');output.rows=4;output.readOnly=true;output.setAttribute('aria-label','Resultado');output.setAttribute('aria-live','polite');outputLabel.append(output);
  const mapping=make('div','cesar-alphabet'),table=make('table');table.setAttribute('aria-label','Correspondência do alfabeto');
  const original=make('tr'),translated=make('tr');original.append(make('th',null,'Entrada'));translated.append(make('th',null,'Saída'));
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';for(const char of alphabet)original.append(make('td',null,char));table.append(original,translated);mapping.append(table);
  body.append(intro,sourceLabel,controls,outputLabel,mapping);
  function update(){
   const n=Number(shift.value);output.value=cesar(source.value,n);translated.replaceChildren(make('th',null,'Saída'));
   for(const char of cesar(alphabet,n))translated.append(make('td',null,char));
   minus.disabled=n===-25;plus.disabled=n===25;
  }
  source.oninput=update;shift.onchange=update;
  minus.onclick=()=>{shift.value=String(Math.max(-25,Number(shift.value)-1));update();};
  plus.onclick=()=>{shift.value=String(Math.min(25,Number(shift.value)+1));update();};
  update();
 }
};
if(typeof registerZeroApp==='function')registerZeroApp(ZERO_CESAR_APP);
if(typeof module!=='undefined')module.exports={cesar,ZERO_CESAR_APP};
