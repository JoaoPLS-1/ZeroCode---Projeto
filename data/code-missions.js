// Real JavaScript function bodies. Metadados públicos; testes e recompensas ficam no servidor.
const CODE_MISSIONS = [
 {id:'computer_dev_left',name:'Restaurar o limite de tentativas',file:'retry.js',
  starter:'// input: { status, attempt }\n// Retorne true para repetir ou false para encerrar.\nreturn true;',
  manual:'O vírus LoopZero removeu o limite de retries. Escreva o corpo de uma função JavaScript: retorne true somente quando input.status for 503 E input.attempt for menor que 3. Em qualquer outro caso, retorne false. Use return, comparações e &&. Exemplo de sintaxe: return input.status === 200; (não é a solução).'},
 {id:'computer_dev_right',name:'Reconstruir a linha do tempo',file:'timeline.js',
  starter:'// input: uma lista de eventos\n// Devolva o horário do evento deploy.\nreturn null;',
  manual:'Localize na lista input o evento cujo type é "deploy" e retorne seu campo time. Se não houver deploy, retorne null. A ordem da lista muda nos testes. Você pode usar for...of ou .find(). Exemplo: const evento = input.find(e => e.type === "login");'},
 {id:'computer_qa_upper',name:'Recuperar os testes de falha',file:'coverage.js',
  starter:'// input: lista de testes { name, status }\n// Retorne os nomes dos testes com status SKIP.\nreturn [];',
  manual:'O malware desativou os testes de falha. Receba uma lista input de objetos {name, status}. Devolva um array com os nomes dos testes cujo status é "SKIP", preservando a ordem. Sem testes ignorados, devolva []. Use filter/map ou um laço com push.'},
 {id:'computer_qa_infra_lower',name:'Reativar a espera progressiva',file:'backoff.js',
  starter:'// input: número da tentativa (0 ou maior)\n// Retorne a espera em milissegundos.\nreturn 0;',
  manual:'Cada tentativa deve esperar 1000 * 2 elevado a input milissegundos, com teto de 8000 ms. input começa em 0. Exemplos: 0 → 1000; 1 → 2000; 2 → 4000; 3 ou mais → 8000. Em JavaScript, potência usa ** e o menor valor usa Math.min(a, b).'},
 {id:'computer_infra_upper',name:'Isolar o vírus e restaurar o serviço',file:'recovery.js',
  starter:'// input: { externalTraffic, retries }\n// Retorne { isolate, rollback }.\nreturn { isolate: false, rollback: false };',
  manual:'Ative o isolamento quando input.retries for maior que 100. Ative rollback somente quando retries for maior que 100 E externalTraffic for "baseline". Retorne um objeto com exatamente as chaves isolate e rollback, ambas booleanas. Isso representa comandos enviados ao ZeroOS simulado.'}
];
if(typeof module!=='undefined')module.exports=CODE_MISSIONS;
