"""Complete compact CSS @imports missed in the historical capture."""
import json,re
from pathlib import Path
import mirror_site as source
manifest_path=source.DEST/'mirror-manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf8'))
source.ASSETS={r['url']:r for r in manifest['assets']}
imports=re.compile(r'@import\s*([\'"])([^\'"]+)\1',re.I)
queue=set();css_records=[]
for r in manifest['assets']:
 if 'css' not in r['type']:continue
 p=source.DEST/r['file']
 if not p.exists():continue
 text=p.read_text(encoding='utf8');css_records.append((r,text))
 for m in imports.finditer(text):
  url=source.canon(m[2],r['url'])
  if url and url not in source.ASSETS:queue.add(url)
new=[]
while queue:
 url=queue.pop()
 if url in source.ASSETS:continue
 record,links=source.fetch_asset(url)
 if not record:continue
 source.ASSETS[url]=record;new.append(record)
 queue.update(link for link in links if link not in source.ASSETS)
for record in new:
 p=source.DEST/record['file'];p.parent.mkdir(parents=True,exist_ok=True)
 if 'text' in record:p.write_text(source.rewrite(record['text'],record['url']),encoding='utf8')
 else:p.write_bytes(record['raw'])
for r,text in css_records:
 rewritten=imports.sub(lambda m:'@import '+m[1]+source.local_url(m[2],r['url'])+m[1],text)
 if rewritten!=text:(source.DEST/r['file']).write_text(rewritten,encoding='utf8')
manifest['assets'].extend({k:v for k,v in r.items() if k not in ('raw','text')} for r in new)
manifest.setdefault('failures',{}).update(source.FAILURES)
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'added':len(new),'failures':source.FAILURES},ensure_ascii=False))

