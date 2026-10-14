// Desafio S2: dados privados, carregados somente pelo servidor.
module.exports = {
  "id": "computer_qa_upper",
  "caso": "retry",
  "camada": "C",
  "flag": "provisoria-3",
  "estacoes": [
    "computer_qa_upper"
  ],
  "titulo": "Recuperar os testes de falha",
  "arquivo": "coverage.js",
  "enunciado": "O malware desativou os testes de falha. Receba uma lista input de objetos {name, status}. Devolva um array com os nomes dos testes cujo status é \"SKIP\", preservando a ordem. Sem testes ignorados, devolva []. Use filter/map ou um laço com push.",
  "codigoInicial": "// input: lista de testes { name, status }\n// Retorne os nomes dos testes com status SKIP.\n// TODO: implemente a recuperação.\nreturn [];",
  "modo": "implementar",
  "casosFixos": [
    [
      {
        "name": "response_200",
        "status": "PASS"
      },
      {
        "name": "response_503",
        "status": "SKIP"
      },
      {
        "name": "retry_limit",
        "status": "SKIP"
      }
    ],
    [
      {
        "name": "a",
        "status": "PASS"
      }
    ],
    [
      {
        "name": "b",
        "status": "SKIP"
      },
      {
        "name": "c",
        "status": "PASS"
      }
    ],
    []
  ],
  "dicas": [
    "Os testes ignorados também contam como pistas sobre a cobertura.",
    "Filtrar escolhe os testes; transformar extrai apenas o nome de cada um.",
    "Observe status para selecionar e name para montar a resposta. Preserve a ordem e trate o caso sem testes ignorados."
  ],
  "maxErros": 3,
  "ordemS2": 2,
  "clueRef": "clue_test_qa_computer",
  "recompensa": "Cobertura recuperada. Credencial do Computador Técnico emitida.",
  gerarCasos(rng) {
    const integer = n => Math.floor(rng()*n), pick = values => values[integer(values.length)];
    const label = () => Array.from({length:16},()=>integer(16).toString(16)).join('');
    const timestamp = () => new Date(integer(86400000)).toISOString().slice(11,23);
    return Array.from({length:24},() => Array.from({length:integer(8)+1},()=>({name:label(),status:pick(["PASS","FAIL","SKIP"])})));
  },
  referencia: input => input.filter(t=>t.status==='SKIP').map(t=>t.name)
};
