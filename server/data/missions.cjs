const { randomInt, randomBytes } = require('node:crypto');
const publicMissions = require('../../data/code-missions.js');
const pick = values => values[randomInt(values.length)];
const label = () => randomBytes(8).toString('hex');
const timestamp = () => new Date(randomInt(86400000)).toISOString().slice(11,23);
const generators = [
 () => ({status:pick([200,500,503]),attempt:randomInt(7)}),
 () => { const events = [{type:'request',time:timestamp()},{type:'retry',time:timestamp()}]; if(randomInt(4))events.splice(randomInt(3),0,{type:'deploy',time:timestamp()});return events; },
 () => Array.from({length:randomInt(1,9)},()=>({name:label(),status:pick(['PASS','FAIL','SKIP'])})),
 () => randomInt(12),
 () => ({externalTraffic:pick(['baseline','high']),retries:randomInt(5000)})
];
const references = [
 input => input.status === 503 && input.attempt < 3,
 input => input.find(e=>e.type==='deploy')?.time ?? null,
 input => input.filter(t=>t.status==='SKIP').map(t=>t.name),
 input => Math.min(8000,1000*2**input),
 input => ({isolate:input.retries>100,rollback:input.retries>100 && input.externalTraffic==='baseline'})
];
const privateData = [
  {
    "id": "computer_dev_left",
    "clueRef": "clue_test_dev_computer_1",
    "fixed": [
      {
        "status": 503,
        "attempt": 0
      },
      {
        "status": 503,
        "attempt": 2
      },
      {
        "status": 503,
        "attempt": 3
      },
      {
        "status": 200,
        "attempt": 0
      },
      {
        "status": 500,
        "attempt": 1
      }
    ],
    "reward": "Limite restaurado. Credencial do Computador Dev 2 recuperada."
  },
  {
    "id": "computer_dev_right",
    "clueRef": "clue_test_dev_computer_2",
    "fixed": [
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
    "reward": "Linha do tempo recuperada. Acesso ao Computador QA liberado."
  },
  {
    "id": "computer_qa_upper",
    "clueRef": "clue_test_qa_computer",
    "fixed": [
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
    "reward": "Cobertura recuperada. Credencial do Computador Técnico emitida."
  },
  {
    "id": "computer_qa_infra_lower",
    "clueRef": "clue_test_qa_infra_computer",
    "fixed": [
      0,
      1,
      2,
      3,
      6
    ],
    "reward": "Espera progressiva ativa. Canal de manutenção do Servidor de Infra habilitado."
  },
  {
    "id": "computer_infra_upper",
    "clueRef": "clue_test_infra_computer",
    "fixed": [
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
    "reward": "LoopZero isolado. Rollback autorizado. Leve as cinco evidências ao Terminal da Reunião."
  }
];
const missions = privateData.map((mission,i)=>({...mission,public:publicMissions[i],reference:references[i],generate:generators[i]}));
function inputs(mission) {
 const result = [...structuredClone(mission.fixed),...Array.from({length:24},mission.generate)];
 for(let i=result.length-1;i>0;i--){const j=randomInt(i+1);[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
module.exports = { missions, inputs };
