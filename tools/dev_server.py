"""Local dev server that disables browser caching, so code changes always
show up on a normal reload (no Ctrl+F5 needed). Run from the project root:

    py tools/dev_server.py
"""
import http.server
import os

os.chdir(os.path.join(os.path.dirname(__file__), ".."))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


http.server.ThreadingHTTPServer(("", 8000), NoCacheHandler).serve_forever()
