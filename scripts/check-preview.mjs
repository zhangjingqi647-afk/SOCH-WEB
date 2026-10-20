import assert from 'node:assert/strict';
import fs from 'node:fs';
const origin=process.argv[2]||'http://127.0.0.1:4181';
const report={origin,checks:[]};
for(const route of ['/','/about/','/faculty-research/faculty/','/news-events/news/page/2/']){
 const response=await fetch(origin+route);const body=await response.text();assert.equal(response.status,200);assert.ok(body.includes('id="root"'));assert.ok(!body.includes('jquery'));report.checks.push({route,status:response.status,reactEntry:true});
}
const response=await fetch(origin+'/wp-content/uploads/2025/05/banner-video.mp4',{headers:{Range:'bytes=0-1023'}});
const bytes=(await response.arrayBuffer()).byteLength;assert.equal(response.status,206);assert.equal(bytes,1024);assert.equal(response.headers.get('content-range'),'bytes 0-1023/11625777');
report.checks.push({route:'hero video',status:response.status,bytes,contentRange:response.headers.get('content-range')});
fs.writeFileSync('docs/http-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
