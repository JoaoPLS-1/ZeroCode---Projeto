const MISSION_FASE1 = {
 id:'protocolo_zero', title:'QUAL É A CAUSA DO APAGÃO?',
 options:[{id:'A',text:'Ataque externo. Bloquear conexões de clientes.'},{id:'B',text:'Falha de hardware. Reiniciar servidores.'},{id:'C',text:'Retry sem limite no deploy 2.1. Reverter a versão e limitar tentativas com espera.'},{id:'D',text:'Excesso de clientes. Aumentar a fila.'}],correctOption:'C',
 results:{correct:{title:'NEXUS RESTABELECIDO',body:['Uma resposta 503 virou milhares de tentativas internas. O deploy removeu o limite de retries e saturou a fila.','Rollback aplicado. Próxima versão: tentativas limitadas, espera progressiva e testes de falha. Você encontrou a causa.']},incorrect:{title:'HIPÓTESE NÃO SUSTENTADA',body:['Essa intervenção não explica as repetições internas após o deploy.','Revise o diff, a linha do tempo e a telemetria no dossiê. O incidente ainda pode ser resolvido.']}}};
if(typeof module !== 'undefined') module.exports=MISSION_FASE1;
