"""Local-only static server with original routes and byte ranges for video."""
import argparse
import functools
import html
import json
import mimetypes
import os
import re
import shutil
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit, parse_qs

ROOT=Path(__file__).resolve().parents[1]
DOCROOT=ROOT/'mirror'
mimetypes.add_type('font/woff2','.woff2')
mimetypes.add_type('font/woff','.woff')
mimetypes.add_type('font/ttf','.ttf')
mimetypes.add_type('application/javascript','.js')

class Handler(SimpleHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(DOCROOT),**kwargs)

    def send_bytes(self,data,content_type='application/json; charset=utf-8'):
        self.send_response(200)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(data)))
        self.send_header('Cache-Control','no-cache')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        route=urlsplit(self.path)
        params=parse_qs(route.query,keep_blank_values=True)
        if route.path=='/wp-json/career/v1/list':
            file=DOCROOT/'__local/careers.json'
            if file.exists():self.send_bytes(file.read_bytes())
            else:self.send_error(404,'Public career snapshot unavailable')
            return
        if route.path=='/wp-json/university/v1/profilePage':
            code=params.get('departmentPkCode',['ALL'])[0] or 'ALL'
            file=DOCROOT/'__local'/('profile-'+re.sub(r'[^A-Za-z0-9]','',code)+'.json')
            if not file.exists(): self.send_error(404,'Public faculty snapshot unavailable');return
            payload=json.loads(file.read_text(encoding='utf-8'))
            data=payload.get('data',{})
            needle=params.get('personName',[''])[0].strip().lower()
            people=data.get('list',[])
            if needle: people=[p for p in people if needle in ' '.join(str(p.get(k) or '') for k in ('name','enName','firstName','lastName')).lower()]
            size=max(1,min(1000,int(params.get('size',['100'])[0])))
            start=max(0,int(params.get('pages',['1'])[0])-1)*size
            data['total']=len(people);data['list']=people[start:start+size]
            self.send_bytes(json.dumps(payload,ensure_ascii=False).encode());return
        if route.path=='/wp-json/university/v1/getOfficialThrustList':
            code=re.sub(r'[^A-Za-z0-9]','',params.get('departmentPkCode',[''])[0])
            file=DOCROOT/'__local'/('thrust-'+code+'.json')
            if file.exists(): self.send_bytes(file.read_bytes())
            else: self.send_error(404,'Public thrust snapshot unavailable')
            return
        if route.path=='/' and 's' in params:
            template=DOCROOT/'__local/search-template.html'
            index=DOCROOT/'__local/search-index.json'
            if template.exists() and index.exists():
                query=params['s'][0].strip()
                records=json.loads(index.read_text(encoding='utf-8'))
                words=query.lower().split()
                records=[p for p in records if re.match(r'/\d{4}/',p['path']) and words and all(word in (p['title']+' '+p['text']).lower() for word in words)]
                records.sort(key=lambda p:p['path'],reverse=True)
                items=[]
                for item in records:
                    date='.'.join(reversed(item['path'].split('/')[1:4]))
                    items.append('<li><a href="'+html.escape(item['path'],quote=True)+'"><p class="title">'+html.escape(item['title'])+'</p></a><div class="abstract"><p>'+html.escape(item['text'][:700])+'</p></div><p class="date">'+date+'</p></li>')
                page=template.read_text(encoding='utf-8').replace('__LOCAL_SEARCH_RESULTS__',''.join(items)).replace('__LOCAL_SEARCH_COUNT__',str(len(items))).replace('__LOCAL_SEARCH_QUERY__',html.escape(query,quote=True))
                self.send_bytes(page.encode(),'text/html; charset=utf-8');return
        super().do_GET()

    def send_head(self):
        path=urlsplit(self.path)
        decoded=unquote(path.path)
        manifest_path=DOCROOT/'mirror-manifest.json'
        routes={}
        if manifest_path.exists():
            manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
            for record in manifest.get('pages',[]):
                key=unquote(urlsplit(record['url']).path).rstrip('/') or '/'
                routes[key]=record
        route=routes.get(decoded.rstrip('/') or '/')
        target=(DOCROOT/route['file']) if route else (DOCROOT/decoded.lstrip('/'))
        if target.is_dir(): target=target/'index.html'
        try: target=target.resolve(); target.relative_to(DOCROOT.resolve())
        except (ValueError,OSError): self.send_error(403); return None
        if not target.is_file(): self.send_error(404); return None
        f=target.open('rb'); size=target.stat().st_size
        start,end=0,size-1
        request_range=self.headers.get('Range')
        if request_range:
            match=re.fullmatch(r'bytes=(\d*)-(\d*)',request_range)
            if match:
                a,b=match.groups()
                if a: start=int(a); end=min(int(b) if b else size-1,size-1)
                elif b: start=max(0,size-int(b))
            if start>=size or end<start:
                f.close(); self.send_response(416); self.send_header('Content-Range',f'bytes */{size}'); self.send_header('Content-Length','0'); self.end_headers(); return None
            self.send_response(206); self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
        else: self.send_response(route.get('status',200) if route else 200)
        self.send_header('Content-Type',self.guess_type(str(target)))
        self.send_header('Content-Length',str(end-start+1))
        self.send_header('Accept-Ranges','bytes')
        self.send_header('Cache-Control','no-cache')
        self.end_headers()
        f.seek(start); self.remaining=end-start+1
        return f

    def copyfile(self,source,outputfile):
        remaining=getattr(self,'remaining',None)
        if remaining is None: return shutil.copyfileobj(source,outputfile)
        try:
            while remaining>0:
                block=source.read(min(1024*1024,remaining))
                if not block: break
                outputfile.write(block); remaining-=len(block)
        except (ConnectionResetError,ConnectionAbortedError,BrokenPipeError): pass

    def log_message(self,fmt,*args):
        if args and str(args[1]) not in ('200','206','304'): super().log_message(fmt,*args)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=4173)
    args=parser.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    print(f'Original website mirror: http://127.0.0.1:{args.port}/',flush=True)
    server.serve_forever()
