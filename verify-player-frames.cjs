const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
assert(fs.existsSync(__dirname+'/assets/player/main/idle8-front.png'),'Atlas idle do protagonista ausente.');
for(const name of ['edu','rick','mark','steve','luna'])
  assert(fs.existsSync(__dirname+'/assets/npcs/idle/'+name+'.png'),`Atlas idle ausente: ${name}`);

// The real left/down atlases have odd dimensions. Every frame must read
// alpha (not another channel) at integer coordinates, including row two.
for (const [width,height] of [[1774,887],[1536,1024]]) {
  const pixels=new Uint8ClampedArray(width*height*4);
  const expected=[];
  for(let frame=0;frame<8;frame++) {
    const x=Math.round(frame%4*width/4)+12;
    const y=Math.round(Math.floor(frame/4)*height/2)+20;
    expected.push({x,y,w:30,h:80});
    for(let py=y;py<y+80;py++) for(let px=x;px<x+30;px++)
      pixels[(py*width+px)*4+3]=255;
  }
  const sandbox={Image:class {},document:{createElement:()=>({
    getContext:()=>({drawImage(){},getImageData:()=>({data:pixels})})
  })}};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(__dirname+'/engine/player.js','utf8'),sandbox);
  sandbox.sheet={naturalWidth:width,naturalHeight:height};
  vm.runInContext('measurePlayerFrames(sheet,2)',sandbox);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.sheet.frames)),expected);
}
console.log('Recorte: oito frames corretos em atlas pares e ímpares.');
