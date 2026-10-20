import fs from 'node:fs';
import path from 'node:path';
const source=path.resolve('mirror'), destination=path.resolve('r2-media');
if(!fs.existsSync(source)&&fs.existsSync(destination)){console.log('r2-media/ is already included; no original capture is needed.');process.exit(0);}
let count=0,bytes=0;
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,entry.name);
 if(entry.isDirectory())walk(file);
 else if(!/\.(html?|js|json|xml|css)$/i.test(entry.name)){
  const target=path.join(destination,path.relative(source,file));fs.mkdirSync(path.dirname(target),{recursive:true});
  if(!fs.existsSync(target)){try{fs.linkSync(file,target);}catch{fs.copyFileSync(file,target);}}
  count++;bytes+=fs.statSync(file).size;
 }
}}
walk(source);console.log(JSON.stringify({directory:destination,files:count,bytes},null,2));
