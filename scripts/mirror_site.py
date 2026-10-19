"""Preserve the original public website markup and all referenced static assets."""
import concurrent.futures as futures
import hashlib
import html
import json
import mimetypes
import os
import re
import time
import urllib.error
import urllib.parse as U
import urllib.request as R
import xml.etree.ElementTree as ET
from pathlib import Path
from lxml import html as LH

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'mirror'
CACHE = ROOT / 'source-inspection' / 'raw'
ORIGIN = 'https://soch.hkust-gz.edu.cn'
DOMAIN = U.urlsplit(ORIGIN).netloc
ASSET_EXT = {'.css','.js','.png','.jpg','.jpeg','.gif','.svg','.webp','.avif','.ico','.woff','.woff2','.ttf','.otf','.eot','.mp4','.webm','.ogg','.mp3','.wav','.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.zip','.json','.vtt','.srt'}
MEDIA_EXT = {'.mp4','.webm','.mp3','.wav','.ogg','.pdf','.zip'}
BLOCKED = ('hm.baidu.com','google-analytics.com','googletagmanager.com','cnzz.com')
PAGES, ASSETS, FAILURES = {}, {}, {}
SEEN_PAGES, SEEN_ASSETS = set(), set()
NS = {'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
URL_RE = re.compile(r'''(?:https?:)?//[^\s<>"'`\\]+|(?:\.\.?/|/wp-content/)[^\s<>"'`<>]*?\.(?:css|js|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot|mp4|webm|pdf)(?:\?[^\s<>"'`]+)?''', re.I)
CSS_URL = re.compile(r'''url\(\s*(['"]?)(.*?)\1\s*\)''', re.I)
ATTR = re.compile(r'''\b(src|href|poster|data-src|data-original|data-background|data-lazy-src)\s*=\s*(["'])(.*?)\2''',re.I|re.S)

def canon(url, base=ORIGIN+'/'):
    url=html.unescape(url.strip()).replace('\\/','/')
    if not url or url.startswith(('data:','blob:','javascript:','mailto:','tel:','#')): return None
    p=U.urlsplit(U.urljoin(base,url))
    if p.scheme not in ('http','https'): return None
    path=U.quote(U.unquote(p.path or '/'),safe='/:@!$&\'()*+,;=-._~')
    return U.urlunsplit((p.scheme,p.netloc.lower(),path,p.query,''))

def path_for(url, page=False):
    p=U.urlsplit(url)
    decoded=U.unquote(p.path).lstrip('/')
    parts=[re.sub(r'[<>:"|?*]', '_',x) for x in decoded.split('/') if x not in ('','.','..')]
    rel=Path(*parts) if parts else Path('.')
    if p.netloc != DOMAIN: rel=Path('__external')/p.netloc/rel
    if page:
        if p.query: rel=Path('__queries')/hashlib.sha256(url.encode()).hexdigest()[:20]/'index.html'
        elif not rel.suffix or p.path.endswith('/'): rel=rel/'index.html'
    elif p.netloc!=DOMAIN and p.query:
        suffix=rel.suffix
        if p.netloc=='fonts.googleapis.com': suffix='.css'
        rel=rel.with_name(rel.stem+'__'+hashlib.sha256(p.query.encode()).hexdigest()[:10]+suffix)
    if len(str(DEST/rel))>235: rel=Path('__long')/(hashlib.sha256(url.encode()).hexdigest()+(''.join(rel.suffixes) or '.html'))
    return rel.as_posix()

def download(url):
    key=hashlib.sha256(url.encode()).hexdigest()
    cache=CACHE/key
    meta=CACHE/(key+'.json')
    if cache.exists() and meta.exists():
        m=json.loads(meta.read_text(encoding='utf-8'))
        return cache.read_bytes(),m['type'],m.get('final',url)
    last_error='download failed'
    for attempt in range(3):
        try:
            req=R.Request(url,headers={'User-Agent':'Mozilla/5.0 SocietyHubLocalMirror/1.0','Accept':'*/*','Referer':ORIGIN+'/'})
            with R.urlopen(req,timeout=65) as r:
                data=r.read(); typ=r.headers.get('Content-Type',''); final=r.url
            cache.write_bytes(data)
            meta.write_text(json.dumps({'type':typ,'final':final,'url':url}),encoding='utf-8')
            return data,typ,final
        except Exception as exc:
            last_error=str(exc)
            if isinstance(exc,urllib.error.HTTPError) and exc.code in (401,403,404,410): break
            if attempt<2: time.sleep(attempt+1)
    raise RuntimeError(last_error)

def page_allowed(url):
    p=U.urlsplit(url)
    if p.netloc!=DOMAIN: return False
    if any(x in p.path for x in ('/wp-admin','/wp-json','/wp-login','/xmlrpc','/feed/','/login-customizer','/career-api')): return False
    if Path(p.path).suffix.lower() in ASSET_EXT: return False
    if p.query and not set(U.parse_qs(p.query)).issubset({'page','paged','lang','p','page_id'}): return False
    return True

def resources(text, url, is_html):
    assets=set(); pages=set()
    css_texts=[]
    if is_html:
        tree=LH.fromstring(text)
        for element in tree.iter():
            if not isinstance(element.tag,str): continue
            if element.tag=='style': css_texts.append(element.text or '')
            for name,value in element.attrib.items():
                if name=='style': css_texts.append(value)
                if name=='href' and element.tag=='a':
                    link=canon(value,url)
                    if link and page_allowed(link): pages.add(link)
                    elif link and Path(U.urlsplit(link).path).suffix.lower() in ASSET_EXT: assets.add(link)
                elif name in ('src','poster','data-src','data-original','data-lazy-src','data-background'):
                    if element.tag=='iframe': continue
                    link=canon(value,url)
                    if link: assets.add(link)
                elif name in ('srcset','data-srcset'):
                    for item in value.split(','):
                        link=canon(item.strip().split(' ')[0],url)
                        if link: assets.add(link)
                elif name=='href' and element.tag=='link':
                    if element.get('rel','').lower() in ('stylesheet','icon','shortcut icon','preload','apple-touch-icon'):
                        link=canon(value,url)
                        if link: assets.add(link)
    elif not U.urlsplit(url).path.lower().endswith('.js'):
        css_texts.append(text)
    for css_text in css_texts:
        for match in CSS_URL.finditer(css_text):
            link=canon(match[2],url)
            if link: assets.add(link)
    # Includes images constructed by the original scripts, while leaving API URLs untouched.
    for match in URL_RE.finditer(text):
        raw=match[0].rstrip(');,}')
        link=canon(raw,url)
        if link and Path(U.urlsplit(link).path).suffix.lower() in ASSET_EXT: assets.add(link)
    for match in re.finditer(r'''@import\s+['"]([^'"]+)['"]''',text,re.I):
        link=canon(match[1],url)
        if link: assets.add(link)
    return {a for a in assets if not any(b in U.urlsplit(a).netloc for b in BLOCKED)},pages

def fetch_page(url):
    try:
        raw,typ,final=download(url)
        if 'html' not in typ and not raw.lstrip().lower().startswith((b'<!doctype',b'<html')): return None,set(),set()
        text=raw.decode('utf-8',errors='replace')
        asset_links,page_links=resources(text,final,True)
        return {'url':url,'file':path_for(url,True),'html':text,'final':final},asset_links,page_links
    except Exception as exc:
        FAILURES[url]=str(exc)
        return None,set(),set()

def fetch_asset(url):
    try:
        raw,typ,final=download(url)
        rel=path_for(url)
        record={'url':url,'file':rel,'type':typ,'bytes':len(raw),'raw':raw,'final':final}
        links=set()
        if any(x in typ for x in ('text/css','javascript')) or U.urlsplit(url).path.endswith(('.css','.js')):
            record['text']=raw.decode('utf-8',errors='replace')
            links,_=resources(record['text'],url,False)
        return record,links
    except Exception as exc:
        FAILURES[url]=str(exc)
        return None,set()

def local_url(raw, base):
    raw=html.unescape(raw)
    url=canon(raw,base)
    if not url: return raw
    fragment=U.urlsplit(html.unescape(raw)).fragment
    record=ASSETS.get(url) or PAGES.get(url)
    if record:
        if url in PAGES and not U.urlsplit(url).query and not record['file'].startswith('__long'):
            value=U.urlsplit(url).path
        else: value='/'+record['file']
        if url in ASSETS:
            value='/'+record['file']
        return U.quote(U.unquote(value),safe='/:@!$&\'()*+,;=-._~')+('#'+fragment if fragment else '')
    if U.urlsplit(url).netloc==DOMAIN and page_allowed(url): return U.urlsplit(url).path+('?' + U.urlsplit(url).query if U.urlsplit(url).query else '')+('#'+fragment if fragment else '')
    if U.urlsplit(url).netloc!=DOMAIN and not U.urlsplit(raw).netloc:
        return url+('#'+fragment if fragment else '')
    return raw

def rewrite(text,url,html_page=False):
    # Keep the original markup, class names, inline scripts and CSS declarations intact.
    script_bodies=[]
    if html_page:
        def protect_script(match):
            script_bodies.append(match[2])
            return match[1]+'__ORIGINAL_SCRIPT_BODY_'+str(len(script_bodies)-1)+'__'+match[3]
        text=re.sub(r'(<script\b[^>]*>)(.*?)(</script>)',protect_script,text,flags=re.I|re.S)
        text=ATTR.sub(lambda m:m[1]+'='+m[2]+html.escape(local_url(m[3],url),quote=False)+m[2],text)
        def srcset(m):
            items=[]
            for part in html.unescape(m[2]).split(','):
                bits=part.strip().split()
                if bits: bits[0]=local_url(bits[0],url)
                items.append(' '.join(bits))
            return m[1]+'"'+', '.join(items)+'"'
        text=re.sub(r'''(\b(?:srcset|data-srcset)\s*=\s*)["']([^"']*)["']''',srcset,text,flags=re.I)
    if html_page:
        text=re.sub(r'''(\bstyle\s*=\s*)(["'])(.*?)\2''',lambda m:m[1]+m[2]+CSS_URL.sub(lambda u:'url('+u[1]+local_url(u[2],url)+u[1]+')',m[3])+m[2],text,flags=re.I|re.S)
        text=re.sub(r'''(<style\b[^>]*>)(.*?)(</style>)''',lambda m:m[1]+CSS_URL.sub(lambda u:'url('+u[1]+local_url(u[2],url)+u[1]+')',m[2])+m[3],text,flags=re.I|re.S)
    elif not U.urlsplit(url).path.lower().endswith('.js'):
        text=CSS_URL.sub(lambda m:'url('+m[1]+local_url(m[2],url)+m[1]+')',text)
    for index,script in enumerate(script_bodies):
        text=text.replace('__ORIGINAL_SCRIPT_BODY_'+str(index)+'__',script)
    for source,record in ASSETS.items():
        if source in text: text=text.replace(source,'/'+record['file'])
        escaped=source.replace('/','\\/')
        if escaped in text: text=text.replace(escaped,('/'+record['file']).replace('/','\\/'))
    text=re.sub(r'''(["'])(?:https?:)?//soch\.hkust-gz\.edu\.cn(?=/|["'])''',r'\1',text)
    return text

def main():
    DEST.mkdir(exist_ok=True); CACHE.mkdir(parents=True,exist_ok=True)
    seeds={ORIGIN+'/'}
    try:
        index=ET.fromstring(download(ORIGIN+'/sitemap_index.xml')[0])
        for item in index.findall('s:sitemap/s:loc',NS):
            site=ET.fromstring(download(item.text)[0])
            for loc in site.findall('s:url/s:loc',NS):
                u=canon(loc.text or '')
                if u and page_allowed(u): seeds.add(u)
    except Exception as exc: print('Sitemap:',exc,flush=True)
    pending=seeds; pending_assets=set()
    with futures.ThreadPoolExecutor(max_workers=6) as pool:
        while pending:
            batch=sorted(pending-SEEN_PAGES)
            if not batch: break
            SEEN_PAGES.update(batch); pending=set()
            print('HTML batch',len(batch),'already',len(PAGES),flush=True)
            jobs={pool.submit(fetch_page,u):u for u in batch}
            for i,job in enumerate(futures.as_completed(jobs),1):
                record,assets,links=job.result()
                if record: PAGES[record['url']]=record
                pending_assets.update(assets); pending.update(links-SEEN_PAGES)
                if i%30==0: print('HTML',len(PAGES),'queued',len(pending),'assets found',len(pending_assets),flush=True)
        while pending_assets:
            batch=sorted(pending_assets-SEEN_ASSETS)
            if not batch: break
            SEEN_ASSETS.update(batch); pending_assets=set()
            print('ASSET batch',len(batch),'already',len(ASSETS),flush=True)
            jobs={pool.submit(fetch_asset,u):u for u in batch}
            for i,job in enumerate(futures.as_completed(jobs),1):
                record,links=job.result()
                if record: ASSETS[record['url']]=record
                pending_assets.update(links-SEEN_ASSETS)
                if i%40==0: print('ASSET',len(ASSETS),'failures',len(FAILURES),flush=True)
    print('Writing original HTML and localized assets…',flush=True)
    for url,record in PAGES.items():
        p=DEST/record['file']; p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text(rewrite(record['html'],url,True),encoding='utf-8')
    for url,record in ASSETS.items():
        p=DEST/record['file']; p.parent.mkdir(parents=True,exist_ok=True)
        if 'text' in record: p.write_text(rewrite(record['text'],url),encoding='utf-8')
        else: p.write_bytes(record['raw'])
    manifest={'source':ORIGIN,'captured':time.strftime('%Y-%m-%dT%H:%M:%S'),'pages':[{k:v for k,v in r.items() if k!='html'} for r in PAGES.values()],'assets':[{k:v for k,v in r.items() if k not in ('raw','text')} for r in ASSETS.values()],'failures':FAILURES}
    (DEST/'mirror-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'pages':len(PAGES),'assets':len(ASSETS),'bytes':sum(r['bytes'] for r in ASSETS.values()),'failures':len(FAILURES)},ensure_ascii=False),flush=True)

if __name__=='__main__': main()
