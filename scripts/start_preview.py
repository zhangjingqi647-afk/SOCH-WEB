"""Start the local mirror and open it in the user's default browser."""
from pathlib import Path
import subprocess
import sys
import time
import urllib.request
import webbrowser

root=Path(__file__).resolve().parents[1]
url='http://127.0.0.1:4173/'
opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
def ready():
    try:
        with opener.open(url,timeout=1) as response:return response.status==200
    except Exception:return False
if not ready():
    flags=getattr(subprocess,'CREATE_NO_WINDOW',0)
    log=(root/'preview.log').open('a',encoding='utf-8')
    subprocess.Popen([sys.executable,'-u',str(root/'scripts/serve_mirror.py'),'--port','4173'],cwd=str(root),stdin=subprocess.DEVNULL,stdout=log,stderr=log,creationflags=flags,close_fds=True)
    for _ in range(40):
        if ready():break
        time.sleep(.1)
if ready():
    print(url)
    webbrowser.open(url)
else:
    print('Could not start local preview. See preview.log.')
    input('Press Enter to close…')
