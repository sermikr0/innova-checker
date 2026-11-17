// Production entry point. Wraps Next.js so the client address comes from the TCP
// socket, never from headers a visitor can forge. Without this, `next start`
// passes a client-supplied X-Forwarded-For straight to the app and every
// IP-based protection (login blocking, rate limits, free-scan limits) can be
// bypassed by sending a fake header.
//
// Tunnels such as JPRQ forward raw bytes, so every visitor would arrive from
// 127.0.0.1. With INNOVA_PROXY_PROTOCOL=loopback the tunnel client (built with
// --proxy-protocol) prefixes each connection with a PROXY v1 header carrying
// the visitor's address; it is honoured only on loopback connections, where
// no outside party can write first.
//
// Behind Cloudflare Tunnel set INNOVA_TRUST_CF=loopback: cloudflared connects
// from localhost and Cloudflare sets CF-Connecting-IP itself (overwriting any
// value the visitor sent), so that header is trusted on loopback connections only.
import "dotenv/config";
import { createServer } from "node:http";
import net from "node:net";
import next from "next";

const port = Number(process.env.PORT ?? 3000);
// BIND_HOST, not HOSTNAME: shells set HOSTNAME to the machine name.
const hostname = process.env.BIND_HOST ?? "0.0.0.0";
const trustedProxies = Number(process.env.TRUSTED_PROXY_COUNT ?? 0);
const proxyProtocol = process.env.INNOVA_PROXY_PROTOCOL === "loopback";
const trustCloudflare = process.env.INNOVA_TRUST_CF === "loopback";
const appUrl = (() => {
  try {
    return new URL(process.env.APP_URL ?? "");
  } catch {
    return null;
  }
})();
const CLIENT_IP_HEADER = "x-innova-client-ip";

process.env.INNOVA_CLIENT_IP_HEADER = CLIENT_IP_HEADER;
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();
await app.prepare();

const isLoopback = (ip) => ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";

function clientAddress(req) {
  if (req.socket.innovaProxiedIp) return req.socket.innovaProxiedIp;
  const socketIp = (req.socket.remoteAddress ?? "0.0.0.0").replace(/^::ffff:/, "");
  if (trustCloudflare && isLoopback(socketIp)) {
    const cf = String(req.headers["cf-connecting-ip"] ?? "").trim();
    if (net.isIP(cf)) return cf.replace(/^::ffff:/, "");
  }
  if (trustedProxies <= 0) return socketIp;
  // Behind N trusted proxies the client is the Nth address from the right once
  // the last proxy's own socket address is appended.
  const chain = String(req.headers["x-forwarded-for"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  chain.push(socketIp);
  return chain[Math.max(0, chain.length - 1 - trustedProxies)];
}

const httpServer = createServer((req, res) => {
  // One canonical public origin: www.<domain> → <domain>, so cookies and the
  // same-origin checks always see APP_URL.
  const host = String(req.headers.host ?? "").toLowerCase();
  // Visitors who reached Cloudflare over plain HTTP are sent to HTTPS: CF-Visitor
  // is set by Cloudflare and only trusted on the loopback connection from cloudflared.
  const viaPlainHttp = trustCloudflare && isLoopback((req.socket.remoteAddress ?? "").replace(/^::ffff:/, "")) && /"scheme":"http"/.test(String(req.headers["cf-visitor"] ?? ""));
  if (appUrl && appUrl.protocol === "https:" && (host === `www.${appUrl.host}` || viaPlainHttp)) {
    res.writeHead(308, { location: `${appUrl.origin}${req.url ?? "/"}` });
    res.end();
    return;
  }
  req.headers[CLIENT_IP_HEADER] = clientAddress(req);
  handle(req, res);
});

// "PROXY TCP4 203.0.113.7 127.0.0.1 51234 3000\r\n" (max 107 bytes, PROXY v1).
const PROXY_LINE = /^PROXY (TCP4|TCP6) ([0-9a-fA-F.:]+) ([0-9a-fA-F.:]+) (\d{1,5}) (\d{1,5})\r\n/;

function acceptProxied(socket) {
  let buffered = Buffer.alloc(0);
  const giveUp = () => {
    socket.removeListener("data", onData);
    socket.pause();
    if (buffered.length) socket.unshift(buffered);
    httpServer.emit("connection", socket);
    socket.resume();
  };
  const onData = (chunk) => {
    buffered = Buffer.concat([buffered, chunk]);
    const text = buffered.toString("latin1", 0, Math.min(buffered.length, 108));
    if (!"PROXY ".startsWith(text.slice(0, 6)) && !text.startsWith("PROXY ")) return giveUp();
    const end = text.indexOf("\r\n");
    if (end < 0) {
      if (buffered.length >= 108) socket.destroy();
      return;
    }
    const m = PROXY_LINE.exec(text.slice(0, end + 2));
    if (!m || net.isIP(m[2]) === 0) return socket.destroy();
    socket.innovaProxiedIp = m[2].replace(/^::ffff:/, "");
    buffered = buffered.subarray(end + 2);
    giveUp();
  };
  socket.on("data", onData);
}

const listener = net.createServer((socket) => {
  if (proxyProtocol && isLoopback(socket.remoteAddress ?? "")) acceptProxied(socket);
  else httpServer.emit("connection", socket);
});
listener.listen(port, hostname, () => {
  console.log(`> Innova Checker ready on http://${hostname}:${port} (trusted proxies: ${trustedProxies}, proxy protocol: ${proxyProtocol ? "loopback" : "off"}, cloudflare: ${trustCloudflare ? "loopback" : "off"})`);
});
