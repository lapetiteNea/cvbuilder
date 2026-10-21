from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
errors = []

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in ('href', 'src') or not value:
                continue
            url = urlsplit(value)
            if url.scheme or url.netloc or not url.path:
                continue
            if url.path.startswith('/'):
                errors.append(f'{self.path}: root-absolute link fails on Pages: {value}')
            elif not (self.path.parent / unquote(url.path)).resolve().exists():
                errors.append(f'{self.path}: missing resource {value}')

for path in ROOT.rglob('*.html'):
    if '.git' in path.parts:
        continue
    parser = Links()
    parser.path = path
    parser.feed(path.read_text())
if errors:
    raise SystemExit('\n'.join(errors))
print('All local HTML links and assets resolve; no root-absolute URLs.')
