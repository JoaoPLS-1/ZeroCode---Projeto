const CLUES = {
  "clue_test_dev_npc_1": {
    "id": "clue_test_dev_npc_1",
    "title": "Retry gerado sem limite",
    "body": [
      "O deploy 2.1 subiu às 02:14. O assistente gerou o arquivo inteiro sem o limite de tentativas. Edu indica o diff e pede que Kael consulte Mark sobre o limite esperado."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_dev_npc_2": {
    "id": "clue_test_dev_npc_2",
    "title": "PR aprovado em 40 s",
    "body": [
      "Rick publicou o retry gerado pelo assistente após os testes passarem. O PR foi aprovado em quarenta segundos. Ninguém sabe quem instalou o assistente: ele já veio no ambiente."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_qa_npc": {
    "id": "clue_test_qa_npc",
    "title": "QA não foi chamado",
    "body": [
      "Mark não foi chamado para testar o 2.1 e descobriu pelo alerta. A ferramenta de relatórios feita com IA aceita qualquer arquivo. O limite esperado era de três tentativas; Steve viu esse número no log."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_infra_npc": {
    "id": "clue_test_infra_npc",
    "title": "Repetição sem falha de hardware",
    "body": [
      "CPU e memória estão normais; algo repete sem parar. O servidor de Infra tem o Wireshark e a senha é de Kael. Steve indica a linha do ano em que nasceu o Transformer e um deslocamento de três casas nas letras."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_cafe_npc_1": {
    "id": "clue_test_cafe_npc_1",
    "title": "App do café feito às pressas",
    "body": [
      "Luna pediu o app de pedidos do café para ontem e o assistente entregou em uma tarde. Kael questiona o que acontece quando alguém usa o app errado."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_cafe_npc_2": {
    "id": "clue_test_cafe_npc_2",
    "title": "Três cobranças com o mesmo identificador",
    "body": [
      "Um cliente foi cobrado três vezes pelo mesmo pedido, com o mesmo identificador. Um colaborador ficou com crédito no app do café e ninguém entende como."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_dev_computer_1": {
    "id": "clue_test_dev_computer_1",
    "title": "Retry sem limite",
    "body": [
      "O commit 7f2 removeu o limite de tentativas. Em caso de 503, send(job) chama a si mesma sem espera."
    ],
    "relevant": true,
    "isFalse": false
  },
  "clue_test_dev_computer_2": {
    "id": "clue_test_dev_computer_2",
    "title": "Deploy às 02:14",
    "body": [
      "A versão 2.1 entrou às 02:14:00. A primeira repetição foi registrada às 02:14:03, com tráfego externo estável."
    ],
    "relevant": true,
    "isFalse": false
  },
  "clue_test_qa_computer": {
    "id": "clue_test_qa_computer",
    "title": "Cobertura incompleta",
    "body": [
      "A suíte verifica apenas status 200. Respostas 503 e limite de retries não têm cobertura."
    ],
    "relevant": true,
    "isFalse": false
  },
  "clue_test_qa_infra_computer": {
    "id": "clue_test_qa_infra_computer",
    "title": "Amplificação interna",
    "body": [
      "Uma única requisição externa gerou 4.096 tentativas internas. O mesmo job voltou à fila sem intervalo."
    ],
    "relevant": true,
    "isFalse": false
  },
  "clue_test_infra_computer": {
    "id": "clue_test_infra_computer",
    "title": "Sem sinal de invasão",
    "body": [
      "O firewall não registra aumento de conexões nem origens desconhecidas. A tempestade nasceu dentro do serviço."
    ],
    "relevant": true,
    "isFalse": false
  }
};
if (typeof module !== "undefined") module.exports = CLUES;
