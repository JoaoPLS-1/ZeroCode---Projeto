const DIALOGS = {
  "dialog_test_dev_1": {
    "kind": "dialogue",
    "npcName": "Edu · Backend",
    "lines": [
      {
        "speaker": "npc",
        "text": "Kael! Finalmente. O 2.1 subiu às 02:14 e tudo desandou. Olha o diff no meu terminal."
      },
      {
        "speaker": "player",
        "text": "O que mudou no retry?"
      },
      {
        "speaker": "npc",
        "text": "Sumiu o limite de tentativas. Ninguém tirou isso de propósito… o assistente gerou o arquivo inteiro e veio assim."
      },
      {
        "speaker": "thought",
        "text": "Limite de tentativas. Por que isso importa? …Se o serviço falha, ele tenta de novo. Se nunca para de tentar…"
      },
      {
        "speaker": "npc",
        "text": "Se quiser entender o log, pergunte ao Mark quantas tentativas o teste dele deveria permitir."
      }
    ]
  },
  "dialog_test_dev_2": {
    "kind": "dialogue",
    "npcName": "Rick · Release",
    "lines": [
      {
        "speaker": "npc",
        "text": "Fui eu que publiquei. Pedi pro assistente refazer o retry, ele gerou, os testes passaram e eu subi. Foi rápido."
      },
      {
        "speaker": "player",
        "text": "Alguém revisou?"
      },
      {
        "speaker": "npc",
        "text": "O PR foi aprovado em quarenta segundos. Era sexta à noite… Todo mundo usa o assistente. Ninguém sabe nem quem instalou, já veio no ambiente."
      },
      {
        "speaker": "thought",
        "text": "Código que ninguém leu, de uma IA que ninguém sabe de onde veio."
      }
    ]
  },
  "dialog_test_qa": {
    "kind": "dialogue",
    "npcName": "Mark · QA",
    "lines": [
      {
        "speaker": "npc",
        "text": "Ninguém me chamou pra testar o 2.1. Descobri pelo alerta."
      },
      {
        "speaker": "npc",
        "text": "E a ferramenta de relatórios que o pessoal 'fez com IA'? Aceita qualquer arquivo. Já avisei, ninguém ouviu."
      },
      {
        "speaker": "npc",
        "text": "Limite? Três tentativas. Era a regra. Fala com o Steve — ele disse que esse número aparece num lugar estranho do log."
      }
    ]
  },
  "dialog_test_infra": {
    "kind": "dialogue",
    "npcName": "Steve · Infra",
    "lines": [
      {
        "speaker": "npc",
        "text": "CPU normal, memória normal. Não é hardware. É alguma coisa repetindo sem parar."
      },
      {
        "speaker": "npc",
        "text": "O servidor de Infra tem o Wireshark, mas a senha é sua, Kael. Só você tem."
      },
      {
        "speaker": "thought",
        "text": "Minha senha. Ótimo. Eu nem lembro o meu ramal."
      },
      {
        "speaker": "npc",
        "text": "Três, é? Tem uma linha no log do NEXUS que parece embaralhada. Fica lá no meio — na linha do ano em que nasceu o Transformer. Desloca as letras três casas e lê."
      }
    ]
  },
  "dialog_test_cafe_1": {
    "kind": "dialogue",
    "npcName": "Luna · Produto",
    "lines": [
      {
        "speaker": "npc",
        "text": "O app de pedidos do café? Eu pedi pra ontem e o assistente entregou em uma tarde. Lindo, funciona!"
      },
      {
        "speaker": "player",
        "text": "Funciona pra quem usa certo. E pra quem usa errado?"
      },
      {
        "speaker": "npc",
        "text": "…Como assim, errado?"
      }
    ]
  },
  "dialog_test_cafe_2": {
    "kind": "dialogue",
    "npcName": "Mateus · Suporte",
    "lines": [
      {
        "speaker": "npc",
        "text": "Um cliente foi cobrado três vezes. Mesmo pedido, mesmo identificador, três cobranças."
      },
      {
        "speaker": "npc",
        "text": "O log de cobranças fica no servidor de release."
      },
      {
        "speaker": "npc",
        "text": "E teve um colaborador que ficou com crédito no app do café. Ninguém entende como."
      },
      {
        "speaker": "thought",
        "text": "Mesmo identificador, três cobranças. O sistema não sabe que já processou aquele pedido."
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
DIALOGS.dialog_livia={kind:'dialogue',npcName:'Lívia · Full-stack',lines:[
 {speaker:'npc',text:"Kael, você está diferente. Mais… cuidadoso. Gosto disso."},
 {speaker:'npc',text:"Deixei cadernos de treinamento nos computadores. Para os estagiários. Mas acho que vão te ajudar a organizar as ideias."},
 {speaker:'npc',text:"O mural da equipe está estranho. Toda vez que alguém abre um aviso, aparece uma janela que ninguém escreveu."}
]};
DIALOGS.dialog_opening={kind:'dialogue',npcName:'D.A.N.I.E.L. · Assistente',lines:[
 {speaker:'thought',text:"Eu conheço essas pessoas. Deveria conhecer. Respira. Ninguém pode perceber."},
 {speaker:'npc',text:"Bom dia, Kael. Sou o D.A.N.I.E.L., seu assistente. Você me configurou há meses — imagino que não se lembre. Tudo bem. Vamos reaprender juntos, uma peça por vez."},
 {speaker:'npc',text:"Converse com a equipe, abra os computadores e leia tudo. Cada coisa que você resolver vai trazer uma lembrança de volta."}
]};
DIALOGS.dialog_dante={kind:'dialogue',npcName:'Dante Kernel · Gestor de Acesso',lines:[
 {speaker:'npc',text:"O sistema de crachás foi feito num fim de semana, com o assistente. Economizamos um mês."},
 {speaker:'npc',text:"Cada um só vê o próprio crachá. Pelo menos foi o que me disseram."},
 {speaker:'thought',text:"'Foi o que me disseram.' Alguém conferiu?"}
]};
if (typeof module !== "undefined") module.exports = DIALOGS;
