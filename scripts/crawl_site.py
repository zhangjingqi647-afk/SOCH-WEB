"""Create an editable, local snapshot of the public Society Hub sitemap."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
import json
import re
import time
import xml.etree.ElementTree as ET

BASE = "https://soch.hkust-gz.edu.cn/"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "site-pages.js"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
ALLOWED = {"h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "li", "a", "img", "figure", "figcaption", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "strong", "b", "em", "i", "br", "hr", "sup", "sub"}
VOID = {"img", "br", "hr"}


class Node:
    def __init__(self, tag, attrs=None):
        self.tag = tag
        self.attrs = attrs or {}
        self.children = []


class ContentParser(HTMLParser):
    """Extract the page's content field into safe, simple HTML nodes."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = []
        self.active = False
        self.depth = 0
        self.title = ""
        self.description = ""
        self.in_title = False
        self.in_desc = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title": self.in_title = True
        if tag == "meta" and attrs.get("name", "").lower() == "description": self.description = attrs.get("content", "")
        if not self.active:
            classes = attrs.get("class", "").split()
            if tag == "div" and any(x in classes for x in ("content-field", "entry-content", "post-content", "content-main", "content_body", "content_area", "page-content-1200", "all-content", "content_text", "events-box", "news-swiper", "career-banner", "staff-words-wrap")):
                self.active, self.depth = True, 1
                self.stack = [("div", self.root)]
            return
        if tag == "div": self.depth += 1
        parent = next((n for _, n in reversed(self.stack) if n is not None), self.root)
        node = None
        if tag in ALLOWED:
            keep = {}
            if tag == "a" and attrs.get("href"):
                keep["href"] = urljoin(BASE, attrs["href"])
            if tag == "img":
                if attrs.get("src"): keep["src"] = urljoin(BASE, attrs["src"])
                if attrs.get("alt"): keep["alt"] = attrs["alt"]
                if attrs.get("width"): keep["width"] = attrs["width"]
                if attrs.get("height"): keep["height"] = attrs["height"]
            node = Node(tag, keep)
            parent.children.append(node)
        if tag not in VOID:
            self.stack.append((tag, node))

    def handle_endtag(self, tag):
        if tag == "title": self.in_title = False
        if not self.active: return
        if tag == "div":
            self.depth -= 1
            if self.depth <= 0:
                self.active = False
                self.stack = []
                return
        for i in range(len(self.stack)-1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self.in_title: self.title += data
        if self.active and data:
            parent = next((n for _, n in reversed(self.stack) if n is not None), self.root)
            parent.children.append(data)


def request(url):
    req = Request(url, headers={"User-Agent": "SocietyHubLocalArchive/1.0 (public website content snapshot)"})
    with urlopen(req, timeout=25) as resp:
        return resp.read().decode(resp.headers.get_content_charset() or "utf-8", errors="replace")


def serialize(node):
    if isinstance(node, str): return node
    return {"tag": node.tag, "attrs": node.attrs, "children": [serialize(c) for c in node.children]}


def fetch_page(url):
    time.sleep(0.08)
    try:
        html = request(url)
        parser = ContentParser()
        parser.feed(html)
        title = re.sub(r"\s+", " ", parser.title).strip()
        path = urlparse(url).path or "/"
        return {"url": url, "path": path, "title": title or path.strip("/").split("/")[-1].replace("-", " ").title() or "Society Hub", "description": parser.description, "content": [serialize(c) for c in parser.root.children]}
    except Exception as exc:
        print(f"Skipped {url}: {exc}")
        return None


def main():
    sitemap = ET.fromstring(request(urljoin(BASE, "sitemap_index.xml")))
    sitemap_urls = [n.text for n in sitemap.findall("sm:sitemap/sm:loc", NS)]
    urls = set()
    for sitemap_url in sitemap_urls:
        try:
            tree = ET.fromstring(request(sitemap_url))
            for node in tree.findall("sm:url/sm:loc", NS):
                url = node.text or ""
                if url.startswith(BASE) and "#" not in url:
                    urls.add(url.split("#", 1)[0])
        except Exception as exc:
            print(f"Could not read sitemap {sitemap_url}: {exc}")
    urls.add(BASE)
    print(f"Found {len(urls)} public pages and posts. Fetching a snapshot…")
    pages = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(fetch_page, u) for u in sorted(urls)]
        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()
            if result: pages.append(result)
            if i % 25 == 0: print(f"Fetched {i}/{len(futures)}")
    pages.sort(key=lambda p: p["url"])
    OUT.write_text("window.SCRAPED_PAGES = " + json.dumps(pages, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Saved {len(pages)} pages to {OUT}")


if __name__ == "__main__":
    main()
