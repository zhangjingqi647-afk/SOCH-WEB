"""Audit redirects and fill resources relative to each final source URL."""
import concurrent.futures as F
import hashlib
import json
import sys
import urllib.error
import urllib.request as R
from pathlib import Path
from urllib.parse import urlsplit
import mirror_site as M

sys.stdout.reconfigure(encoding='utf-8',errors='backslashreplace')
file=M.DEST/'mirror-manifest.json'
manifest=json.loads(file.read_text(encoding='utf-8'))
M.PAGES.update({p['url']:p for p in manifest['pages']})
M.ASSETS.update({a['url']:a for a in manifest['assets']})
asset_refs=set();page_refs=set()
for page in manifest['pages']:
    cache=M.CACHE/hashlib.sha256(page['url'].encode()).hexdigest()
    if cache.exists():
        assets,pages=M.resources(cache.read_text(encoding='utf-8',errors='replace'),page.get('final',page['url']),True)
        asset_refs.update(assets);page_refs.update(pages)
for asset in manifest['assets']:
    if any(t in asset.get('type','') for t in ('text/css','javascript')):
        cache=M.CACHE/hashlib.sha256(asset['url'].encode()).hexdigest()
        if cache.exists(): asset_refs.update(M.resources(cache.read_text(encoding='utf-8',errors='replace'),asset.get('final',asset['url']),False)[0])

pending=asset_refs-set(M.ASSETS)
checked=set()
with F.ThreadPoolExecutor(max_workers=6) as pool:
    while pending:
        batch=list(pending-checked)
        if not batch:break
        checked.update(batch);pending=set()
        print('Additional or originally unavailable assets:',len(batch),flush=True)
        for record,links in pool.map(M.fetch_asset,batch):
            if record:
                M.ASSETS[record['url']]=record
                target=M.DEST/record['file'];target.parent.mkdir(parents=True,exist_ok=True)
                target.write_bytes(record['raw'])
            asset_refs.update(links);pending.update(links-set(M.ASSETS)-checked)

# Preserve the original website's error-page appearance for links already broken upstream.
for url in sorted(page_refs-set(M.PAGES)):
    if url.endswith('/r') or 'target=' in url or '%5C' in url:continue
    try:
        request=R.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':M.ORIGIN+'/'})
        with R.urlopen(request,timeout=25) as response:
            raw=response.read();typ=response.headers.get('Content-Type','');status=response.status;final=response.url
    except urllib.error.HTTPError as error:
        raw=error.read();typ=error.headers.get('Content-Type','');status=error.code;final=url
    except Exception as error:
        print('Unavailable source route',url,str(error),flush=True);continue
    if 'html' not in typ:continue
    record={'url':url,'file':M.path_for(url,True),'final':final,'status':status}
    M.PAGES[url]=record
    key=hashlib.sha256(url.encode()).hexdigest()
    (M.CACHE/key).write_bytes(raw)
    (M.CACHE/(key+'.json')).write_text(json.dumps({'url':url,'type':typ,'final':final}),encoding='utf-8')
    target=M.DEST/record['file'];target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(M.rewrite(raw.decode('utf-8',errors='replace'),final,True),encoding='utf-8')
    print('Preserved source route',status,url,flush=True)

all_failures={**manifest.get('failures',{}),**M.FAILURES}
manifest['discoveryRejected']=len([u for u in all_failures if u not in asset_refs and u not in page_refs])
manifest['failures']={u:error for u,error in all_failures.items() if (u in asset_refs or u in page_refs) and u not in M.ASSETS and u not in M.PAGES}
manifest['pages']=[{k:v for k,v in a.items() if k!='html'} for a in M.PAGES.values()]
manifest['assets']=[{k:v for k,v in a.items() if k not in ('raw','text')} for a in M.ASSETS.values()]
file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Final source pages:',len(M.PAGES),'assets:',len(M.ASSETS),'source missing resources:',len(manifest['failures']),flush=True)
