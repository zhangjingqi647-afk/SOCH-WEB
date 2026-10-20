import fs from 'node:fs';
import path from 'node:path';
const seen=new Set(),missing=new Set();
function check(value){
 if(typeof value!=='string')return;
 for(const match of value.matchAll(/(?:^|[\s("',])((?:\/(?:wp-content|wp-includes|__local\/photos|__external|__long)\/)[^\s"'(),<>]+)/g)){
  let url=match[1].replace(/[?#].*$/,'');try{url=decodeURIComponent(url);}catch{}
  seen.add(url);if(!fs.existsSync(path.join('r2-media',url))&&!fs.existsSync(path.join('mirror',url)))missing.add(url);
 }
}
function walk(value){if(typeof value==='string')check(value);else if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')Object.values(value).forEach(walk);}
function directory(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())directory(file);else if(entry.name.endsWith('.json'))walk(JSON.parse(fs.readFileSync(file,'utf8')));else if(entry.name.endsWith('.css'))check(fs.readFileSync(file,'utf8'));}}
directory('public/content');directory('public/theme');
const report={checked:seen.size,missing:[...missing].sort()};fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/asset-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
