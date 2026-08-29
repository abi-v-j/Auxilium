import http from "http";
import { env } from "./config/env.js";

export function startHealthServer() {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "auxilium" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Auxilium Telegram bot is running");
  });

  server.listen(env.port, () => {
    console.log(`Health server running on port ${env.port}`);
  });

  return server;
}
