const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
http.createServer((req,res)=>{
 let file;try {file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);res.end();return;}
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(file===root)file=path.join(root,'index.html');
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);});
}).listen(8765,'127.0.0.1',()=>console.log('ZeroCode: http://127.0.0.1:8765'));
