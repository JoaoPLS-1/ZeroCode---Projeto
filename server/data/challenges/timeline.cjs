// Desafio S2: dados privados, carregados somente pelo servidor.
module.exports = {
  "id": "computer_dev_right",
  "caso": "retry",
  "camada": "C",
  "flag": "provisoria-2",
  "estacoes": [
    "computer_dev_right"
  ],
  "titulo": "Reconstruir a linha do tempo",
  "arquivo": "timeline.js",
  "enunciado": "Localize na lista input o evento cujo type é \"deploy\" e retorne seu campo time. Se não houver deploy, retorne null. A ordem da lista muda nos testes. Você pode usar for...of ou .find(). Exemplo: const evento = input.find(e => e.type === \"login\");",
  "codigoInicial": "// input: uma lista de eventos\n// Devolva o horário do evento deploy.\n// TODO: implemente a recuperação.\nreturn null;",
  "modo": "implementar",
  "casosFixos": [
    [
      {
        "type": "request",
        "time": "02:13:59"
      },
      {
        "type": "deploy",
        "time": "02:14:00"
      },
      {
        "type": "retry",
        "time": "02:14:03"
      }
    ],
    [
      {
        "type": "deploy",
        "time": "10:00:00"
      }
    ],
    [
      {
        "type": "retry",
        "time": "12:00"
      }
    ],
    []
  ],
  "dicas": [
    "Procure o evento que mudou o serviço, independentemente da posição na lista.",
    "Uma busca por tipo de evento encontra o registro; o horário é outra propriedade desse registro.",
    "Observe type ao percorrer a lista e devolva time do evento encontrado. Trate também a lista vazia e a busca sem resultado."
  ],
  "maxErros": 3,
  "ordemS2": 1,
  "clueRef": "clue_test_dev_computer_2",
  "recompensa": "Linha do tempo recuperada. Acesso ao Computador QA liberado.",
  gerarCasos(rng) {
    const integer = n => Math.floor(rng()*n), pick = values => values[integer(values.length)];
    const label = () => Array.from({length:16},()=>integer(16).toString(16)).join('');
    const timestamp = () => new Date(integer(86400000)).toISOString().slice(11,23);
    return Array.from({length:24},() => {const events=[{type:"request",time:timestamp()},{type:"retry",time:timestamp()}];if(integer(4))events.splice(integer(3),0,{type:"deploy",time:timestamp()});return events;});
  },
  referencia: input => input.find(e=>e.type==='deploy')?.time ?? null
};
