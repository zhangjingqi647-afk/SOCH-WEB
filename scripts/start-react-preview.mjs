import fs from 'node:fs';
import {spawn} from 'node:child_process';
const port=5173,url=`http://127.0.0.1:${port}/`;
let running=false;
try{const response=await fetch(url,{signal:AbortSignal.timeout(1500)});running=response.ok;}catch{}
if(!running){
 if(!fs.existsSync('node_modules/vite/bin/vite.js')){console.error('Please run npm install first.');process.exit(1);}
 const log=fs.openSync('react-preview.log','a');
 const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:process.cwd(),detached:true,windowsHide:true,stdio:['ignore',log,log]});child.unref();
 for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,500));try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok){running=true;break;}}catch{}}
}
if(!running){console.error('Preview did not start. Check react-preview.log.');process.exit(1);}
console.log(`React preview: ${url}`);
if(process.platform==='win32')spawn('explorer.exe',[url],{windowsHide:true,detached:true,stdio:'ignore'}).unref();
