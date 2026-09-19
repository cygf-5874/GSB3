const http = require("http"), fs = require("fs"), p = require("path");
const root = process.cwd();
http.createServer((req, res) => {
  let u = req.url === "/" ? "/index.html" : req.url;
  const fp = p.join(root, decodeURIComponent(u.split("?")[0]));
  fs.readFile(fp, (e, d) => {
    if (e) { res.writeHead(404); res.end("404"); return; }
    const t = { ".css": "text/css", ".js": "text/javascript" }[p.extname(fp)] || "text/html";
    res.writeHead(200, { "Content-Type": t + "; charset=utf-8" });
    res.end(d);
  });
}).listen(8765, () => console.log("static server on 8765"));
