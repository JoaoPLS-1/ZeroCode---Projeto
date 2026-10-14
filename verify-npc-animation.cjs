const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const scope=vm.createContext({});
vm.runInContext(fs.readFileSync(__dirname+'/engine/renderer.js','utf8'),scope);
const pose=(id,time,reduced=false)=>scope.npcIdlePose(id,time,reduced);
for(const id of ['npc_cafe_1','npc_cafe_2','npc_cafe_decoy']) {
  for(let time=0;time<30;time+=0.016) {
    const a=pose(id,time),b=pose(id,time+0.016);
    assert(Math.abs(a.stretch-1)<=0.0081);
    assert(Math.abs(a.sway)<=0.0091);
    assert(Math.abs(a.stretch-b.stretch)<0.001);
    assert(Math.abs(a.sway-b.sway)<0.001);
  }
  assert.equal(pose(id,12,true).stretch,1);
  assert.equal(pose(id,12,true).sway,0);
}
assert.notEqual(pose('npc_cafe_1',1).stretch,pose('npc_cafe_2',1).stretch);
console.log('NPCs: movimento suave, limitado, dessincronizado e movimento reduzido aprovados.');
