import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || 8123);

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon"
};

createServer((request, response) => {
    const urlPath = request.url === "/" ? "/index.html" : decodeURIComponent(request.url.split("?")[0]);
    const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(root, safePath);

    if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not Found");
        return;
    }

    const mimeType = mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": mimeType });
    createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
    console.log(`Serving ${root} on http://127.0.0.1:${port}`);
});
