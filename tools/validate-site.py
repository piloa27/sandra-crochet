"""Validación local de SEO y archivos estáticos. Ejecutar: python tools/validate-site.py"""
import json
import re
import struct
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = 'https://piloa27.github.io/sandra-crochet/'


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
        self.meta_counts = Counter()
        self.ids = Counter()
        self.links = []
        self.sources = []
        self.h1 = 0
        self.lang = None
        self.json_ld = []
        self.in_json = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids[attrs['id']] += 1
        if tag == 'html':
            self.lang = attrs.get('lang')
        if tag == 'h1':
            self.h1 += 1
        if tag == 'meta':
            name = attrs.get('name', attrs.get('property'))
            if name:
                self.meta[name] = attrs.get('content')
                self.meta_counts[name] += 1
        if tag == 'link':
            self.links.append(attrs)
        if attrs.get('src', '').startswith('./'):
            self.sources.append(attrs['src'])
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.in_json = True

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_json = False

    def handle_data(self, text):
        if self.in_json:
            self.json_ld.append(text)


def jpeg_dimensions(path):
    with path.open('rb') as file:
        assert file.read(2) == b'\xff\xd8', 'No es un JPEG real'
        while True:
            marker = file.read(2)
            if not marker:
                raise AssertionError('No se encontraron dimensiones JPEG')
            length = struct.unpack('>H', file.read(2))[0]
            if marker[1] in (0xC0, 0xC1, 0xC2):
                _, height, width = struct.unpack('>BHH', file.read(5))
                return width, height
            file.seek(length - 2, 1)


html = (ROOT / 'index.html').read_text(encoding='utf-8')
doc = Document()
doc.feed(html)
assert doc.lang == 'es-UY'
assert doc.h1 == 1
assert all(value == 1 for value in doc.ids.values()), 'IDs duplicados'
assert all(value == 1 for value in doc.meta_counts.values()), 'Metadatos duplicados'
assert doc.meta['google-site-verification'] == 'sx-iAqHEwhH3dvT3-22wXaeqfVmco87ui-yEDMdCSJA'
assert doc.meta['og:url'] == PUBLIC
assert doc.meta['og:image'] == PUBLIC + 'assets/img/og-image.jpg'
assert doc.meta['og:image:width'] == '1200' and doc.meta['og:image:height'] == '630'
assert doc.meta['og:type'] == 'website' and doc.meta['og:locale'] == 'es_UY'
assert doc.meta['twitter:card'] == 'summary_large_image'
assert [link['href'] for link in doc.links if link.get('rel') == 'canonical'] == [PUBLIC]
assert 'noindex' not in doc.meta.get('robots', '')
structured = json.loads(''.join(doc.json_ld))
assert structured['@type'] == 'Organization'
assert structured['telephone'] == '+59894333518'
assert structured['url'] == PUBLIC
for source in doc.sources + [link['href'] for link in doc.links if link.get('href', '').startswith('./')]:
    assert (ROOT / source).is_file(), source
for path in (ROOT / 'js').glob('*.js'):
    for dependency in re.findall(r"from ['\"](\./[^'\"]+)['\"]", path.read_text(encoding='utf-8')):
        assert (path.parent / dependency).is_file(), dependency
tree = ET.parse(ROOT / 'sitemap.xml')
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
assert [element.text for element in tree.findall('s:url/s:loc', ns)] == [PUBLIC]
assert not tree.findall('s:url/s:lastmod', ns)
assert jpeg_dimensions(ROOT / 'assets/img/og-image.jpg') == (1200, 630)
assert not (ROOT / 'robots.txt').exists()
print('OK: HTML, metadatos únicos, verificación de Google, JSON-LD, enlaces locales, sitemap y JPG 1200x630.')
