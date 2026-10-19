"""Check source preservation and the local website's essential behavior."""
import concurrent.futures as F
import hashlib
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request as R
from pathlib import Path
from lxml import html as H
import mirror_site as M

sys.stdout.reconfigure(encoding='utf-8',errors='backslashreplace')
manifest=json.loads((M.DEST/'mirror-manifest.json').read_text(encoding='utf-8'))
problems=[];structural=[]
for page in manifest['pages']:
    file=M.DEST/page['file']
    if not file.exists(): problems.append('Missing page: '+page['file']);continue
    cache=M.CACHE/hashlib.sha256(page['url'].encode()).hexdigest()
    if not cache.exists():continue
    try:
        old=H.fromstring(cache.read_bytes());new=H.fromstring(file.read_bytes())
        signature=lambda tree:[(n.tag,n.get('class'),n.get('id')) for n in tree.iter() if isinstance(n.tag,str)]
        if signature(old)!=signature(new):structural.append(page['url'])
    except Exception as exc:problems.append('Could not compare '+page['file']+': '+str(exc))
for asset in manifest['assets']:
    file=M.DEST/asset['file']
    if not file.exists():problems.append('Missing asset: '+asset['file'])
fonts=[a for a in manifest['assets'] if Path(a['file']).suffix.lower() in ('.ttf','.otf','.woff','.woff2','.eot')]
videos=[a for a in manifest['assets'] if Path(a['file']).suffix.lower() in ('.mp4','.webm')]
node=Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
syntax_regressions=[];checked=0
def syntax(text):return subprocess.run([str(node),'--check','-'],input=text,encoding='utf-8',errors='replace',capture_output=True).returncode
if node.exists():
    for asset in manifest['assets']:
        if not asset['url'].split('?')[0].endswith('.js') or '/hkust-society-hub-' not in asset['url']:continue
        old=(M.CACHE/hashlib.sha256(asset['url'].encode()).hexdigest()).read_text(encoding='utf-8',errors='replace')
        local=(M.DEST/asset['file']).read_text(encoding='utf-8',errors='replace')
        if syntax(local) and not syntax(old):syntax_regressions.append(asset['file'])
        checked+=1
    representative=['/','/programs/','/academics/cncc/programs/','/faculty-research/faculty/','/careers/faculty-recruitment/','/careers/staff-recruitment/','/news-events/events/']
    for path in representative:
        page=next((p for p in manifest['pages'] if p['url']==M.ORIGIN+path),None)
        if not page:continue
        old=H.fromstring((M.CACHE/hashlib.sha256(page['url'].encode()).hexdigest()).read_bytes())
        new=H.fromstring((M.DEST/page['file']).read_bytes())
        a=old.xpath('//script[not(@src)]');b=new.xpath('//script[not(@src)]')
        for before,after in zip(a,b):
            if before.get('type','').lower() not in ('','text/javascript','application/javascript'):continue
            if syntax(after.text or '') and not syntax(before.text or ''):syntax_regressions.append(page['file']+' inline script')
            checked+=1

opener=R.build_opener(R.ProxyHandler({}))
base='http://127.0.0.1:4173'
def head_page(page):
    from urllib.parse import urlsplit
    path=urlsplit(page['url']).path
    try:
        with opener.open(R.Request(base+path,method='HEAD'),timeout=20) as r:code=r.status
    except urllib.error.HTTPError as e:code=e.code
    except Exception as e:return path+': '+str(e)
    expected=page.get('status',200)
    return None if code==expected else path+': expected '+str(expected)+' got '+str(code)
with F.ThreadPoolExecutor(max_workers=8) as pool:http_errors=[e for e in pool.map(head_page,manifest['pages']) if e]
checks={}
for name,path in [('home','/'),('faculty','/wp-json/university/v1/profilePage?size=100'),('thrust','/wp-json/university/v1/getOfficialThrustList?departmentPkCode=10011A10000000000H2S'),('careers','/wp-json/career/v1/list'),('search','/?s=society')]:
    try:
        with opener.open(base+path,timeout=20) as r:data=r.read();checks[name]={'status':r.status,'bytes':len(data)}
        if name=='faculty':checks[name]['records']=len(json.loads(data)['data']['list'])
        if name=='search':checks[name]['usesOriginalTemplate']=b'class="search_result"' in data
    except Exception as e:checks[name]={'error':str(e)}
try:
    path='/wp-content/uploads/2025/05/banner-video.mp4'
    with opener.open(R.Request(base+path,headers={'Range':'bytes=0-1023'}),timeout=20) as r:
        checks['heroVideoRange']={'status':r.status,'bytes':len(r.read()),'range':r.headers.get('Content-Range')}
except Exception as e:checks['heroVideoRange']={'error':str(e)}
report={'pages':len(manifest['pages']),'assets':len(manifest['assets']),'fontFiles':len(fonts),'videoFiles':len(videos),'downloadedBytes':sum(a['bytes'] for a in manifest['assets']),'missingLocalFiles':problems,'changedDOMStructure':structural,'javascriptChecks':checked,'newJavaScriptSyntaxErrors':syntax_regressions,'pageHttpErrors':http_errors,'checks':checks,'originalUnavailable':list(manifest.get('failures',{}))}
(M.ROOT/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2),flush=True)
if problems or structural or syntax_regressions or http_errors or any('error' in c for c in checks.values()):sys.exit(1)
