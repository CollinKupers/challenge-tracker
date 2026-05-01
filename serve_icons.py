import os, http.server, socketserver
os.chdir(os.path.join(os.path.dirname(__file__), "public"))
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", 7723), http.server.SimpleHTTPRequestHandler) as h:
    h.serve_forever()
