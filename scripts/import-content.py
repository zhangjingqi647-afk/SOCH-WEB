"""One-time migration from captured source to editable React content trees.

Do not run after editing content without reviewing the generated changes.
No original scripts or raw HTML strings are used by the React app.
"""
import hashlib,json,re,sys
from pathlib import Path
from urllib.parse import urlsplit,unquote,urljoin
from lxml import html
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'mirror'
OUT=ROOT/'public/content'
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'pages').mkdir(exist_ok=True)
(OUT/'shared').mkdir(exist_ok=True)
THEME=ROOT/'public/theme';THEME.mkdir(exist_ok=True)
manifest=json.loads((SOURCE/'mirror-manifest.json').read_text(encoding='utf8'))
styles={};shared={};routes=[];handlers=set();seen_routes=set()
def save(path,value):path.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':')),encoding='utf8')
def digest(value):return hashlib.sha256(value.encode()).hexdigest()[:16]
def tree(e):
 if not isinstance(e.tag,str) or e.tag.lower() in ('script','noscript'):return None
 attrs=dict(e.attrib)
 if 'ref' in attrs:attrs['data-content-ref']=attrs.pop('ref')
 for k in list(attrs):
  if k.startswith('on'):
   handlers.add(attrs[k])
   if k=='onclick':
    m=re.search(r"window\.open\(['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]",attrs[k])
    if m:attrs['data-navigate']=m[1];attrs['data-target']=m[2]
    scroll=re.search(r"scrollToArea\(['\"]([^'\"]+)['\"]\)",attrs[k])
    if scroll:attrs['data-scroll']=scroll[1]
   del attrs[k]
 children=[]
 if e.text:children.append(e.text)
 for c in e:
  v=tree(c)
  if v is not None:children.append(v)
  if c.tail:children.append(c.tail)
 if e.tag in ('table','thead','tbody','tfoot','tr','colgroup'):
  children=[c for c in children if not isinstance(c,str) or c.strip()]
 if e.tag=='table':
  normalized=[];rows=[]
  for child in children:
   if isinstance(child,dict) and child['tag']=='tr':rows.append(child)
   else:
    if rows:normalized.append({'tag':'tbody','attrs':{},'children':rows});rows=[]
    normalized.append(child)
  if rows:normalized.append({'tag':'tbody','attrs':{},'children':rows})
  children=normalized
 return {'tag':e.tag,'attrs':attrs,'children':children}
def share(node):
 value=tree(node);key=digest(json.dumps(value,ensure_ascii=False));shared[key]=value;return key
def stylesheet(href):
 if href in styles:return styles[href]
 p=SOURCE/unquote(urlsplit(href).path).lstrip('/')
 if not p.is_file():return None
 key=digest(href)+'.css';styles[href]='/theme/'+key
 css=p.read_text(encoding='utf8',errors='replace')
 def replace(m):
  v=m[2].strip()
  if v.startswith(('data:','http:','https:','//','#')):return m[0]
  return 'url('+m[1]+urljoin(urlsplit(href).path,v)+m[1]+')'
 css=re.sub(r'url\(([\'"]?)(.*?)\1\)',replace,css)
 def imported(m):
  target=urljoin(urlsplit(href).path,m[2]);resolved=stylesheet(target)
  return '@import '+m[1]+(resolved or target)+m[1]
 css=re.sub(r'@import\s*([\'"])([^\'"]+)\1',imported,css)
 (THEME/key).write_text(css,encoding='utf8');return styles[href]
for record in manifest['pages']:
 p=SOURCE/record['file']
 if not p.exists():continue
 route=unquote(urlsplit(record['url']).path)
 if not route.endswith('/') and not Path(route).suffix:route+='/'
 route=route or '/'
 if route in seen_routes:continue
 seen_routes.add(route)
 d=html.fromstring(p.read_text(encoding='utf8'))
 mains=d.xpath('//*[@id="main"]');main=mains[0] if mains else d.find('body')
 if main is None:continue
 heads=main.xpath('./header');feet=main.xpath('./footer')
 content=[tree(e) for e in main if e not in heads+feet];content=[v for v in content if v is not None]
 kind='home' if route=='/' else 'faculty' if route.rstrip('/')=='/faculty-research/faculty' else 'article' if re.match(r'/\d{4}/',route) else 'page'
 title=''.join(d.xpath('//title/text()'))
 data={'path':route,'title':title,'lang':d.get('lang','en'),'mainAttrs':dict(main.attrib),'header':share(heads[0]) if heads else None,'footer':share(feet[0]) if feet else None,'content':content,'styles':[s for href in d.xpath('//link[@rel="stylesheet"]/@href') if (s:=stylesheet(href))],'inlineStyles':d.xpath('//style/text()'),'status':record.get('status',200),'kind':kind}
 key=digest(route);save(OUT/'pages'/(key+'.json'),data)
 routes.append({k:data[k] for k in ('path','title','kind','status','lang')}|{'file':'/content/pages/'+key+'.json'})
for key,value in shared.items():save(OUT/'shared'/(key+'.json'),value)
save(OUT/'routes.json',routes)
save(OUT/'search.json',json.loads((SOURCE/'__local/search-index.json').read_text(encoding='utf8')))
people=[]
for p in json.loads((SOURCE/'__local/profile-ALL.json').read_text(encoding='utf8'))['data']['list']:
 jobs=[j for j in p.get('jobs',[]) if j.get('campus')=='gz' and 'MBA+' not in (j.get('departmentEnName') or '')]
 if not jobs:continue
 people.append({'id':p['id'],'enName':p['enName'],'name':p['name'],'email':p['email'],'photoUrl':p['photo'][0]['urlHost'] if p.get('photo') else '', 'title':jobs[-1]['jobEnName'],'thrustList':[j['departmentEnName'] for j in jobs],'departments':[j['departmentPkCode'] for j in jobs]})
people.sort(key=lambda p:p['enName'].split()[-1].lower());save(OUT/'faculty.json',people)
for p in (SOURCE/'__local').glob('profile-*.json'):
 if p.stem=='profile-ALL':continue
 save(OUT/(p.stem+'.json'),[v['id'] for v in json.loads(p.read_text(encoding='utf8'))['data']['list']])
for p in (SOURCE/'__local').glob('thrust-*.json'):save(OUT/p.name,json.loads(p.read_text(encoding='utf8')))
save(OUT/'careers.json',json.loads((SOURCE/'__local/careers.json').read_text(encoding='utf8')))
# Keep search page structure, replacing only the result list in React.
search=html.fromstring((SOURCE/'__local/search-template.html').read_text(encoding='utf8').replace('__LOCAL_SEARCH_RESULTS__','').replace('__LOCAL_SEARCH_COUNT__','0').replace('__LOCAL_SEARCH_QUERY__',''))
main=search.xpath('//*[@id="main"]')[0]
save(OUT/'search-page.json',{'path':'/search/','title':'Search - Society Hub','lang':'en','mainAttrs':dict(main.attrib),'header':share(main.xpath('./header')[0]),'footer':share(main.xpath('./footer')[0]),'content':[tree(e) for e in main if e.tag not in ('header','footer','script')],'styles':[s for href in search.xpath('//link[@rel="stylesheet"]/@href') if (s:=stylesheet(href))],'inlineStyles':search.xpath('//style/text()'),'status':200,'kind':'search'})
for key,value in shared.items():save(OUT/'shared'/(key+'.json'),value)
save(OUT/'migration-report.json',{'sourcePageRecords':len(manifest['pages']),'pages':len(routes),'sharedComponents':len(shared),'stylesheets':len(styles),'faculty':len(people),'removedLegacyHandlers':sorted(handlers),'sourceFailures':manifest.get('failures',[])})
archives={}
for record in manifest['pages']:
 route=unquote(urlsplit(record['url']).path)
 if not re.search(r'/(news|events)(/page/\d+)?/$',route):continue
 base=re.sub(r'/page/\d+/$','/',route)
 d=html.fromstring((SOURCE/record['file']).read_text(encoding='utf8'))
 for item in d.xpath('//li[contains(concat(" ",normalize-space(@class)," ")," news-item ")]'):
  link=item.xpath('.//a/@href');key=link[0] if link else digest(item.text_content())
  archives.setdefault(base,{})[key]={'node':tree(item),'text':item.text_content().strip(),'href':key}
save(OUT/'archives.json',{k:list(v.values()) for k,v in archives.items()})
print(f'Migrated {len(routes)} pages, {len(shared)} shared components, {len(people)} faculty; no source scripts retained.')
