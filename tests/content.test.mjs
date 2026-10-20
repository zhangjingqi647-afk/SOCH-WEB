import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const read=file=>JSON.parse(fs.readFileSync('public'+file,'utf8'));
const routes=read('/content/routes.json');
function walk(node,visit){if(typeof node==='string')return;visit(node);node.children.forEach(c=>walk(c,visit));}
test('all 390 source records map to 367 unique React routes',()=>{
 assert.equal(read('/content/migration-report.json').sourcePageRecords,390);assert.equal(routes.length,367);assert.equal(new Set(routes.map(r=>r.path)).size,367);
 for(const route of routes){const page=read(route.file);assert.equal(page.path,route.path);for(const key of ['header','footer'])if(page[key])assert.ok(fs.existsSync('public/content/shared/'+page[key]+'.json'));for(const href of page.styles)assert.ok(fs.existsSync('public'+href));}
});
test('content contains no executable source scripts or inline event handlers',()=>{
 for(const route of routes){const page=read(route.file);page.content.forEach(n=>walk(n,node=>{assert.notEqual(node.tag,'script');assert.ok(Object.keys(node.attrs).every(k=>!k.startsWith('on')));assert.ok(!('ref' in node.attrs),'Legacy HTML ref must not become a React string ref');}));}
});
test('homepage keeps eight original hero slides and local autoplay video',()=>{
 const page=read(routes.find(r=>r.path==='/').file);let videos=[],hero;
 page.content.forEach(n=>walk(n,node=>{if(node.tag==='video')videos.push(node);if(node.attrs.class?.includes('home-banner-wrap'))hero=node;}));
 assert.ok(videos.some(n=>n.attrs.src.includes('banner-video.mp4')&&'autoplay' in n.attrs&&'muted' in n.attrs));
 let slides=0;walk(hero,n=>{if(n.attrs.class==='swiper-slide')slides++;});assert.equal(slides,8);
});
test('faculty data has 96 profiles and expected FTEC filter membership',()=>{
 const faculty=read('/content/faculty.json');assert.equal(faculty.length,96);const ids=read('/content/profile-10011A10000000000H2S.json');assert.equal(ids.length,25);assert.equal(faculty.filter(p=>ids.includes(p.id)).length,25);assert.ok(faculty.every(p=>p.photoUrl.startsWith('/__local/photos/')));
});
test('search and archive pagination include captured content',()=>{
 const index=read('/content/search.json');assert.ok(index.length>300);assert.ok(index.some(p=>(p.title+' '+p.text).toLowerCase().includes('fintech')));
 const archives=read('/content/archives.json');assert.ok(archives['/news-events/news/'].length>100);
 assert.ok(routes.some(r=>r.path==='/news-events/news/page/33/'));
});
test('deployment output excludes mirrored HTML and video blobs',()=>{
 const index=fs.readFileSync('dist/index.html','utf8');assert.ok(index.includes('/assets/'));assert.ok(!index.includes('jquery'));assert.ok(fs.existsSync('dist/_redirects'));assert.ok(!fs.existsSync('dist/wp-content'));
});
