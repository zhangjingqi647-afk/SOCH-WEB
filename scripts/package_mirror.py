"""Package the editable mirror without the duplicate download cache."""
from pathlib import Path
from zipfile import ZipFile,ZIP_STORED,ZIP_DEFLATED
import json
root=Path(__file__).resolve().parents[1]
archive=root/'SOCH-Original-Mirror.zip'
files=list((root/'mirror').rglob('*'))
files=[p for p in files if p.is_file()]
files += [root/name for name in ('README.md','复刻说明.md','查看网站.cmd','validation-report.json') if (root/name).exists()]
files += list((root/'scripts').glob('*mirror*.py'))+[root/'scripts/start_preview.py',root/'scripts/capture_dynamic.py']
files=sorted(set(files))
written=0;next_progress=1024**3
with ZipFile(archive,'w',allowZip64=True) as bundle:
    for file in files:
        compressed=file.suffix.lower() in ('.html','.css','.js','.json','.md','.py','.cmd','.svg')
        bundle.write(file,file.relative_to(root).as_posix(),compress_type=ZIP_DEFLATED if compressed else ZIP_STORED,compresslevel=6 if compressed else None)
        written+=file.stat().st_size
        if written>=next_progress:
            print('Packaged',round(written/1024**3,2),'GiB',flush=True);next_progress+=1024**3
with ZipFile(archive) as bundle:
    print(json.dumps({'archive':str(archive),'files':len(bundle.infolist()),'bytes':archive.stat().st_size,'uncompressed':sum(f.file_size for f in bundle.infolist())}),flush=True)
