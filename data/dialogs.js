const DIALOGS = {
  "dialog_test_dev_1": {
    "kind": "dialogue",
    "npcName": "Lia · Backend",
    "lines": [
      {
        "speaker": "npc",
        "text": "Às 02:14 publicamos a versão 2.1. O retry foi alterado nessa versão. Verifique o diff no meu terminal."
      }
    ]
  },
  "dialog_test_dev_2": {
    "kind": "dialogue",
    "npcName": "Edu · Release",
    "lines": [
      {
        "speaker": "npc",
        "text": "O tráfego externo não aumentou. Os erros começaram segundos depois do deploy, antes de qualquer alerta de rede."
      }
    ]
  },
  "dialog_test_qa": {
    "kind": "dialogue",
    "npcName": "Nara · QA",
    "lines": [
      {
        "speaker": "npc",
        "text": "O pipeline passou, mas só simulamos respostas 200. Ninguém testou o comportamento quando o serviço retorna 503."
      }
    ]
  },
  "dialog_test_infra": {
    "kind": "dialogue",
    "npcName": "Dante · Infra",
    "lines": [
      {
        "speaker": "npc",
        "text": "CPU e memória estavam normais antes da fila crescer. Reiniciar os servidores só aliviou o problema por alguns segundos."
      }
    ]
  },
  "dialog_test_cafe_1": {
    "kind": "dialogue",
    "npcName": "Bia · Produto",
    "lines": [
      {
        "speaker": "npc",
        "text": "Ouvi dizer que foi um ataque externo. Mas não vi nenhum log que confirme isso. Melhor verificar o firewall."
      }
    ]
  },
  "dialog_test_cafe_2": {
    "kind": "dialogue",
    "npcName": "Rui · Suporte",
    "lines": [
      {
        "speaker": "npc",
        "text": "Um cliente recebeu a mesma confirmação várias vezes. Todas tinham o mesmo identificador de requisição."
      }
    ]
  },
  "investigation_test_dev_1": {
    "kind": "investigation",
    "npcName": "Terminal · Código",
    "lines": [
      {
        "speaker": "npc",
        "text": "O commit 7f2 removeu o limite de tentativas. Em caso de 503, send(job) chama a si mesma sem espera."
      }
    ]
  },
  "investigation_test_dev_2": {
    "kind": "investigation",
    "npcName": "Terminal · Release",
    "lines": [
      {
        "speaker": "npc",
        "text": "A versão 2.1 entrou às 02:14:00. A primeira repetição foi registrada às 02:14:03, com tráfego externo estável."
      }
    ]
  },
  "investigation_test_qa_1": {
    "kind": "investigation",
    "npcName": "Terminal · Testes",
    "lines": [
      {
        "speaker": "npc",
        "text": "A suíte verifica apenas status 200. Respostas 503 e limite de retries não têm cobertura."
      }
    ]
  },
  "investigation_test_qa_infra_2": {
    "kind": "investigation",
    "npcName": "Terminal · Telemetria",
    "lines": [
      {
        "speaker": "npc",
        "text": "Uma única requisição externa gerou 4.096 tentativas internas. O mesmo job voltou à fila sem intervalo."
      }
    ]
  },
  "investigation_test_infra_1": {
    "kind": "investigation",
    "npcName": "Terminal · Firewall",
    "lines": [
      {
        "speaker": "npc",
        "text": "O firewall não registra aumento de conexões nem origens desconhecidas. A tempestade nasceu dentro do serviço."
      }
    ]
  },
  "dialog_test_decoy": {
    "kind": "dialogue",
    "npcName": "Zeca · Café",
    "lines": [
      {
        "speaker": "npc",
        "text": "Se o café tivesse retry infinito, eu não reclamaria. O sistema de vocês, por outro lado…"
      }
    ]
  }
};
// Perguntas de abertura; as respostas e referências de pistas originais permanecem.
const OPENING_QUESTIONS = {
 dialog_test_dev_1:'O que mudou antes de o problema aparecer?',
 dialog_test_dev_2:'Os erros começaram antes ou depois da publicação?',
 dialog_test_qa:'O problema apareceu durante os testes?',
 dialog_test_infra:'Como estavam os servidores antes da falha?',
 dialog_test_cafe_1:'Você ouviu alguma coisa sobre o incidente?',
 dialog_test_cafe_2:'O que os clientes perceberam?',
 dialog_test_decoy:'Você tem alguma pista sobre o que aconteceu?'
};
for (const [id,text] of Object.entries(OPENING_QUESTIONS)) DIALOGS[id].lines.unshift({speaker:'player',text});
// Identidades vinculadas aos pontos de interação, sem mudar as pistas.
const NPC_DIALOG_NAMES = {
 dialog_test_dev_1:'Edu · Backend',dialog_test_dev_2:'Rick · Release',
 dialog_test_qa:'Mark · QA',dialog_test_infra:'Steve · Infra',
 dialog_test_cafe_1:'Luna · Produto',dialog_test_cafe_2:'Mateus · Suporte',dialog_test_decoy:'Kael · Café'
};
for(const [id,name] of Object.entries(NPC_DIALOG_NAMES)) DIALOGS[id].npcName=name;
DIALOGS.dialog_livia={kind:'dialogue',npcName:'Lívia · Full-stack',lines:[
 {speaker:'player',text:'Lívia, como organizamos a apresentação do que encontramos?'},
 {speaker:'npc',text:'Conecte o que mudou no código, o que os testes cobriram e o que os registros mostram. A conclusão precisa explicar todas as evidências.'},
 {speaker:'player',text:'Vou revisar os registros e apresentar a causa no terminal central.'},
 {speaker:'npc',text:'Combinado. Um bom plano começa com uma explicação clara do problema.'}
]};
if (typeof module !== "undefined") module.exports = DIALOGS;
