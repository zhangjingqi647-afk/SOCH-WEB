"""Re-apply URL localization offline from the retained original source files."""
import hashlib
import json
from pathlib import Path
import mirror_site as mirror

manifest=json.loads((mirror.DEST/'mirror-manifest.json').read_text(encoding='utf-8'))
mirror.PAGES.update({p['url']:p for p in manifest['pages']})
mirror.ASSETS.update({a['url']:a for a in manifest['assets']})
for record in manifest['pages']+manifest['assets']:
    url=record['url']
    cache=mirror.CACHE/hashlib.sha256(url.encode()).hexdigest()
    is_page=url in mirror.PAGES
    is_text=is_page or any(t in record.get('type','') for t in ('text/css','javascript')) or url.split('?')[0].endswith(('.css','.js'))
    if is_text and cache.exists():
        text=cache.read_text(encoding='utf-8',errors='replace')
        target=mirror.DEST/record['file']
        target.write_text(mirror.rewrite(text,record.get('final',url),is_page),encoding='utf-8')
print('Localized original HTML, CSS and JS:',len(manifest['pages']),'pages,',len(manifest['assets']),'assets.')
