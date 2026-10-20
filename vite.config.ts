import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
// Serve only captured resources, never the old HTML or JavaScript application.
function media(): Plugin {
  const mount = (server: { middlewares: { use: (fn: any) => void } }) => server.middlewares.use((req: any, res: any, next: any) => {
    let pathname: string;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname); } catch { return next(); }
    if (!/^\/(wp-content|wp-includes|__local\/photos|__external|__long)\//.test(pathname) || /\.(html?|js)$/i.test(pathname)) return next();
    const mediaRoot=fs.existsSync(path.join(root,'r2-media'))?'r2-media':'mirror';
    const file = path.resolve(root, mediaRoot, '.' + pathname);
    if (!file.startsWith(path.resolve(root, mediaRoot) + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
    const size = fs.statSync(file).size;
    const mime: Record<string,string> = {'.mp4':'video/mp4','.webm':'video/webm','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.pdf':'application/pdf','.css':'text/css'};
    res.setHeader('Content-Type', mime[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    let start = 0, end = size - 1;
    if (range) {
      start = range[1] ? Number(range[1]) : Math.max(0,size-Number(range[2]));
      end = range[1] && range[2] ? Math.min(Number(range[2]),end) : end;
      if (start >= size || end < start) {res.statusCode=416;res.setHeader('Content-Range',`bytes */${size}`);res.end();return;}
      res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);
    }
    res.setHeader('Content-Length',end-start+1);
    if(req.method==='HEAD')return res.end();
    const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  });
  return { name:'local-captured-media',configureServer(server){mount(server);},configurePreviewServer(server){mount(server);} };
}
export default defineConfig(({mode}) => {
  const env=loadEnv(mode,root,'');
  const assetBase=(env.VITE_ASSET_BASE_URL || '').replace(/\/$/,'');
  return {plugins:[react(),media(),{
    name:'cloudflare-css-media',
    generateBundle(_options,bundle){
      // Public CSS is copied after this hook; transform it in closeBundle instead.
    },
    closeBundle(){
      const folder=path.join(root,'dist/theme');
      if(assetBase && fs.existsSync(folder)) for(const name of fs.readdirSync(folder)){
        const file=path.join(folder,name);
        fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/url\((['"]?)(\/(?:wp-content|wp-includes|__local|__external|__long)\/[^)]*?)\1\)/g,(_m,q,url)=>`url(${q}${assetBase}${url}${q})`));
      }
    }
  }],optimizeDeps:{entries:['src/main.tsx']},server:{strictPort:true,watch:{ignored:['**/mirror/**','**/source-inspection/**','**/r2-media/**']}},preview:{strictPort:true},build:{chunkSizeWarningLimit:700}};
});

