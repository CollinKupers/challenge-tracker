const http = require("http");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "public");
const mime = { ".html": "text/html", ".png": "image/png", ".json": "application/json" };
http.createServer((req, res) => {
  const file = path.join(root, req.url === "/" ? "/index.html" : req.url);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "text/plain" });
    res.end(data);
  });
}).listen(7723, () => console.log("ready"));
