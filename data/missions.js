const MISSION_FASE1 = {
 id:'protocolo_zero', title:'COMO RESPONDER AO INCIDENTE?',
 choices:[
  {id:'omega',title:'ÔMEGA',speech:'Kael, encontramos ÔMEGA. O que faremos com ela e com o servidor legado?',options:[
   {id:'isolar',text:'Isolar ÔMEGA e o servidor legado.'},
   {id:'monitorar',text:'Deixar ÔMEGA ativa e só monitorar.'},
   {id:'desligar',text:'Desligar tudo sem investigar mais.'}]},
  {id:'deploy',title:'Deploy 2.1',speech:'Agora, escolha como responder à tempestade de retries do deploy 2.1.',options:[
   {id:'rollback',text:'Fazer rollback e corrigir o retry com limite e espera.'},
   {id:'fila',text:'Manter o deploy e aumentar a fila.'},
   {id:'reiniciar',text:'Reiniciar os servidores.'}]},
  {id:'processo',title:'Processo',speech:'Por fim, como a equipe deve trabalhar depois deste incidente?',options:[
   {id:'revisao',text:'Exigir revisão humana, acionar QA e usar pipeline que barra testes falhos.'},
   {id:'proibir',text:'Proibir IA no time.'},
   {id:'manter',text:'Manter o processo como está.'}]}
 ]};
if(typeof module !== 'undefined') module.exports=MISSION_FASE1;
