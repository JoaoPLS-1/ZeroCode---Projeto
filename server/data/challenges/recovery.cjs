// Desafio S2: dados privados, carregados somente pelo servidor.
module.exports = {
  "id": "computer_infra_upper",
  "caso": "retry",
  "camada": "C",
  "flag": "provisoria-5",
  "estacoes": [
    "computer_infra_upper"
  ],
  "titulo": "Isolar o vírus e restaurar o serviço",
  "arquivo": "recovery.js",
  "enunciado": "Ative o isolamento quando input.retries for maior que 100. Ative rollback somente quando retries for maior que 100 E externalTraffic for \"baseline\". Retorne um objeto com exatamente as chaves isolate e rollback, ambas booleanas. Isso representa comandos enviados ao ZeroOS simulado.",
  "codigoInicial": "// input: { externalTraffic, retries }\n// Retorne { isolate, rollback }.\n// TODO: implemente a recuperação.\nreturn { isolate: false, rollback: false };",
  "modo": "implementar",
  "casosFixos": [
    {
      "externalTraffic": "baseline",
      "retries": 4096
    },
    {
      "externalTraffic": "high",
      "retries": 4096
    },
    {
      "externalTraffic": "baseline",
      "retries": 100
    },
    {
      "externalTraffic": "baseline",
      "retries": 0
    }
  ],
  "dicas": [
    "Isolar o vírus e reverter o deploy são decisões diferentes.",
    "Uma decisão depende do volume de retries; a outra combina esse volume com o tráfego externo.",
    "Confira retries e externalTraffic separadamente. Monte duas decisões booleanas e devolva exatamente as propriedades pedidas no manual."
  ],
  "maxErros": 3,
  "ordemS2": 4,
  "clueRef": "clue_test_infra_computer",
  "recompensa": "LoopZero isolado. Rollback autorizado. Leve as cinco evidências ao Terminal da Reunião.",
  gerarCasos(rng) {
    const integer = n => Math.floor(rng()*n), pick = values => values[integer(values.length)];
    const label = () => Array.from({length:16},()=>integer(16).toString(16)).join('');
    const timestamp = () => new Date(integer(86400000)).toISOString().slice(11,23);
    return Array.from({length:24},() => ({externalTraffic:pick(["baseline","high"]),retries:integer(5000)}));
  },
  referencia: input => ({isolate:input.retries>100,rollback:input.retries>100 && input.externalTraffic==='baseline'})
};
