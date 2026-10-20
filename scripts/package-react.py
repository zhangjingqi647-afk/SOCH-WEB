"""Package the actual React project plus local/R2 media, excluding old site HTML."""
from pathlib import Path
import zipfile
ROOT=Path(__file__).resolve().parents[1]
files=['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','tsconfig.json','vite.config.ts','index.html','.gitignore','.env.example','wrangler.toml','README.md','AGENTS.md','查看网站.cmd','复刻说明.md']
folders=['src','public','docs','tests','cloudflare','r2-media']
scripts=['check-cloudflare.mjs','export-media.mjs','start-react-preview.mjs','audit-assets.mjs','check-preview.mjs']
target=ROOT/'SOCH-React-Complete.zip'
with zipfile.ZipFile(target,'w',allowZip64=True) as archive:
 for name in files+['scripts/'+s for s in scripts]:archive.write(ROOT/name,name,compress_type=zipfile.ZIP_DEFLATED)
 for folder in folders:
  for p in sorted((ROOT/folder).rglob('*')):
   if p.is_file():archive.write(p,p.relative_to(ROOT).as_posix(),compress_type=zipfile.ZIP_STORED if folder=='r2-media' else zipfile.ZIP_DEFLATED)
print(f'{target.name}: {target.stat().st_size} bytes')
