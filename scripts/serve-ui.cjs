const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(process.argv[2] || "dist-geo");
const port = Number(process.argv[3] || 8084);
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
if (!fs.existsSync(path.join(root, "index.html")))
  throw new Error(
    "Exporta primero: npx expo export --platform all --output-dir dist-geo",
  );
http
  .createServer((req, res) => {
    let filename;
    try {
      filename = path.resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    if (filename !== root && !filename.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
      if (path.extname(filename)) {
        res.writeHead(404);
        res.end();
        return;
      }
      filename = path.join(root, "index.html");
    }
    res.writeHead(200, {
      "Content-Type":
        mime[path.extname(filename)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(filename).pipe(res);
  })
  .listen(port, "127.0.0.1", () =>
    process.stdout.write(`Demo UI: http://127.0.0.1:${port}\n`),
  );
