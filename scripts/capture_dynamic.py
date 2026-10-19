"""Capture public faculty data and retain the original search page for offline use."""
import concurrent.futures as F
import hashlib
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlencode,urlsplit
from lxml import html as LH
import mirror_site as M
sys.stdout.reconfigure(encoding='utf-8',errors='backslashreplace')

M.DEST.mkdir(exist_ok=True)
folder=M.DEST/'__local'
folder.mkdir(exist_ok=True)
departments={'FTEC':'10011A10000000000H2S','IPE':'10011A10000000000H2U','UGOD':'10011A10000000000H2Y','CNCC':'10011A100000000259HQ'}
datasets={}
api='https://soch.hkust-gz.edu.cn/wp-json/university/v1/'
for name,code in [('ALL','')]+list(departments.items()):
    params={'affiliatedUnits':'SOCIHUB','languageType':'en','personName':'','pages':'1','size':'100'}
    params['departmentPkCode' if code else 'dataSourcesCodes']=code or 'OUTSIDE_NC'
    url=api+'profilePage?'+urlencode(params)
    try:
        payload=json.loads(M.download(url)[0]); datasets['profile-'+(code or 'ALL')]=payload
        print('Faculty',name,'records',len(payload.get('data',{}).get('list',[])),flush=True)
    except Exception as exc: print('API capture failed:',url,str(exc),flush=True)
    if code:
        try:
            url=api+'getOfficialThrustList?'+urlencode({'affiliatedUnits':'SOCIHUB','departmentPkCode':code})
            datasets['thrust-'+code]=json.loads(M.download(url)[0])
        except Exception as exc: print('Thrust API capture failed:',name,str(exc),flush=True)

photos=set()
def collect(obj):
    if isinstance(obj,dict):
        if isinstance(obj.get('photo'),list):
            for photo in obj['photo']:
                if photo.get('urlHost'): photos.add(photo['urlHost'])
        elif obj.get('pkPsndoc') and obj.get('enName'):
            photos.add('https://hrapi.hkust-gz.edu.cn/photo/img?key='+obj['pkPsndoc'])
        for value in obj.values(): collect(value)
    elif isinstance(obj,list):
        for item in obj: collect(item)
for payload in datasets.values(): collect(payload)
photo_map={}
def photo_download(url):
    try:
        raw,typ,_=M.download(M.canon(url))
        suffix='.png' if 'png' in typ else '.jpg'
        rel='__local/photos/'+hashlib.sha256(url.encode()).hexdigest()[:20]+suffix
        p=M.DEST/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw)
        return url,'/'+rel
    except Exception as exc:
        print('Photo not available',url,str(exc),flush=True)
        return url,url
with F.ThreadPoolExecutor(max_workers=6) as pool:
    for original,local in pool.map(photo_download,photos): photo_map[original]=local
def localize(obj):
    if isinstance(obj,dict):
        if obj.get('pkPsndoc') and obj.get('enName') and not obj.get('photo'):
            u='https://hrapi.hkust-gz.edu.cn/photo/img?key='+obj['pkPsndoc']
            if u in photo_map: obj['photo']=[{'urlHost':photo_map[u]}]
        for key,value in list(obj.items()):
            obj[key]=photo_map.get(value,value) if isinstance(value,str) else localize(value)
        return obj
    if isinstance(obj,list): return [localize(item) for item in obj]
    return obj
for name,payload in datasets.items():
    (folder/(name+'.json')).write_text(json.dumps(localize(payload),ensure_ascii=False),encoding='utf-8')

manifest_path=M.DEST/'mirror-manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
M.PAGES.update({p['url']:p for p in manifest['pages']})
M.ASSETS.update({p['url']:p for p in manifest['assets']})
search_url=M.ORIGIN+'/?s=society'
search_path=M.ROOT/'source-inspection/search.html'
search=search_path.read_text(encoding='utf-8-sig') if search_path.exists() else M.download(search_url)[0].decode('utf-8')
links,_=M.resources(search,search_url,True)
pending=links-set(M.ASSETS)
while pending:
    batch=list(pending);pending=set()
    for url in batch:
        record,extra=M.fetch_asset(url)
        if record:
            M.ASSETS[url]=record
            p=M.DEST/record['file'];p.parent.mkdir(parents=True,exist_ok=True)
            p.write_bytes(record['raw'])
            pending.update(extra-set(M.ASSETS))
search=M.rewrite(search,search_url,True)
search=re.sub(r'(<ul class="result">).*?(</ul>)',r'\1__LOCAL_SEARCH_RESULTS__\2',search,count=1,flags=re.S)
search=re.sub(r'(<div class="search_result">).*?(</div>)',r'\1Found __LOCAL_SEARCH_COUNT__ results for News\2',search,count=1,flags=re.S)
search=search.replace('value="society"','value="__LOCAL_SEARCH_QUERY__"')
(folder/'search-template.html').write_text(search,encoding='utf-8')
index=[]
for page in manifest['pages']:
    try:
        root=LH.parse(str(M.DEST/page['file'])); title=' '.join(root.xpath('//title/text()')).strip()
        blocks=root.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," content-main ")]')
        if not blocks: blocks=root.xpath('//section[contains(@class,"main-container")]')
        for elem in root.xpath('//script|//style'): elem.drop_tree()
        content=' '.join(re.sub(r'\s+',' ',b.text_content()).strip() for b in blocks)
        index.append({'path':urlsplit(page['url']).path,'title':title.replace(' - Society Hub',''),'text':content})
    except Exception: pass
(folder/'search-index.json').write_text(json.dumps(index,ensure_ascii=False),encoding='utf-8')
manifest['assets']=[{k:v for k,v in a.items() if k not in ('raw','text')} for a in M.ASSETS.values()]
manifest['localPublicDatasets']=len(datasets)
manifest['facultyPhotos']=len(photo_map)
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Captured',len(datasets),'public data responses,',len(photo_map),'faculty photographs and the original search template.',flush=True)
