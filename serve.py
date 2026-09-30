#!/usr/bin/env python3
"""
Local preview server.

Use this instead of `python3 -m http.server`. The plain one sends no
cache headers, so Chrome will happily keep serving you a stale index.html,
style.css or config.js on a normal refresh — you edit a file, reload, and
nothing appears to have changed. This sends no-store on everything, so a
normal refresh is always the real thing.

    python3 serve.py          # http://localhost:8765
"""
import http.server

PORT = 8765


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):   # quieter output
        pass


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
        print(f"Serving {PORT} with caching disabled — http://localhost:{PORT}")
        httpd.serve_forever()
