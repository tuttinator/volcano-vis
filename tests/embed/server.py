"""Strict static mount for integration tests: no SPA fallback outside the blog subpath."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[2]
MOUNT='/experiments/volcanoes/'
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        url=unquote(urlsplit(self.path).path)
        if url=='/article.html':
            data=(ROOT/'tests/embed/article.html').read_bytes();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(data);return
        if not url.startswith(MOUNT):self.send_error(404);return
        relative=url[len(MOUNT):] or 'index.html';path=(ROOT/'dist-blog'/relative).resolve()
        if not path.is_relative_to((ROOT/'dist-blog').resolve()) or not path.is_file():self.send_error(404);return
        self.path='/'+relative
        super().do_GET()
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT/'dist-blog'),**kwargs)
    def log_message(self,*args):pass
ThreadingHTTPServer(('127.0.0.1',4181),Handler).serve_forever()
