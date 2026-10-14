const CLUES = {
  "clue_test_dev_npc_1": {
    "id": "clue_test_dev_npc_1",
    "title": "O retry infinito",
    "body": [
      "Às 02:14 publicamos a versão 2.1. O retry foi alterado nessa versão. Verifique o diff no meu terminal."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_dev_npc_2": {
    "id": "clue_test_dev_npc_2",
    "title": "A janela do incidente",
    "body": [
      "O tráfego externo não aumentou. Os erros começaram segundos depois do deploy, antes de qualquer alerta de rede."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_qa_npc": {
    "id": "clue_test_qa_npc",
    "title": "O teste que faltou",
    "body": [
      "O pipeline passou, mas só simulamos respostas 200. Ninguém testou o comportamento quando o serviço retorna 503."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_infra_npc": {
    "id": "clue_test_infra_npc",
    "title": "Máquinas saudáveis",
    "body": [
      "CPU e memória estavam normais antes da fila crescer. Reiniciar os servidores só aliviou o problema por alguns segundos."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_cafe_npc_1": {
    "id": "clue_test_cafe_npc_1",
    "title": "Um rumor de invasão",
    "body": [
      "Ouvi dizer que foi um ataque externo. Mas não vi nenhum log que confirme isso. Melhor verificar o firewall."
    ],
    "relevant": false,
    "isFalse": false
  },
  "clue_test_cafe_npc_2": {
    "id": "clue_test_cafe_npc_2",
    "title": "O mesmo pedido, mil vezes",
    "body": [
      "Um cliente recebeu a mesma confirmação várias vezes. Todas tinham o mesmo identificador de requisição."
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
