// Prosty serwer podglądu dla Green Forest — zero zależności.
// Uruchom: node server.js   (albo kliknij start-preview.cmd)
// Serwuje folder ./public na http://localhost:8080 z obsługą "ładnych" adresów
// (np. /wycinka-drzew/ -> /wycinka-drzew/index.html).

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "public");
const PORT = process.env.PORT || 8080;
const liveReloadClients = new Set();
let reloadTimer;

const LIVE_RELOAD_SCRIPT = `
<script>
(() => {
  const source = new EventSource("/__live_reload");
  source.addEventListener("reload", () => window.location.reload());
})();
</script>`;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolveFile(urlPath) {
  // odetnij query/hash, zdekoduj, zablokuj wyjście poza ROOT
  let p = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  let full = path.normalize(path.join(ROOT, p));
  if (!full.startsWith(ROOT)) return null; // ochrona przed path traversal

  try {
    const st = fs.statSync(full);
    if (st.isDirectory()) full = path.join(full, "index.html");
  } catch (_) {
    // brak pliku/katalogu — spróbuj p + ".html", potem p + "/index.html"
    if (fs.existsSync(full + ".html")) full = full + ".html";
    else if (fs.existsSync(path.join(full, "index.html"))) full = path.join(full, "index.html");
  }
  return full;
}

function notifyLiveReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const client of liveReloadClients) client.write("event: reload\\ndata: changed\\n\\n");
  }, 100);
}

fs.watch(ROOT, { recursive: true }, notifyLiveReload);

const server = http.createServer((req, res) => {
  if (req.url.split("?")[0] === "/__live_reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\\n\\n");
    liveReloadClients.add(res);
    req.on("close", () => liveReloadClients.delete(res));
    return;
  }

  const file = resolveFile(req.url);
  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    // 404 -> serwuj dedykowaną stronę 404.html (jak Cloudflare 404-page)
    const notFound = path.join(ROOT, "404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    if (fs.existsSync(notFound)) fs.createReadStream(notFound).pipe(res);
    else res.end('<h1>404 — nie znaleziono</h1><p><a href="/">Wróć na stronę główną</a></p>');
    console.log("404", req.url);
    return;
  }
  const ext = path.extname(file).toLowerCase();
  const type = TYPES[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
  if (ext === ".html") {
    fs.readFile(file, "utf8", (error, content) => {
      if (error) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Nie udało się odczytać strony podglądu.");
        return;
      }
      res.end(content.replace(/<\/body>/i, `${LIVE_RELOAD_SCRIPT}</body>`));
    });
  } else {
    fs.createReadStream(file).pipe(res);
  }
  console.log("200", req.url, "->", path.relative(ROOT, file));
});

server.listen(PORT, () => {
  console.log("\n  Green Forest — serwer podglądu");
  console.log("  ---------------------------------");
  console.log("  Otwórz w przeglądarce:  http://localhost:" + PORT);
  console.log("  Zatrzymaj:              Ctrl+C\n");
});
