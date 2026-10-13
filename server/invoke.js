const http = require("node:http");
const { Writable } = require("node:stream");

function invoke(app, { method, url, headers, body }) {
  return new Promise((resolve, reject) => {
    const socket = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
    socket.remoteAddress = "127.0.0.1";
    const req = new http.IncomingMessage(socket);
    req.method = method || "GET";
    req.url = url;
    req.headers = { ...(headers || {}) };
    const payload = body && body.length ? body : Buffer.alloc(0);
    if (!req.headers["content-length"]) req.headers["content-length"] = String(payload.length);
    req.push(payload);
    req.push(null);

    const res = new http.ServerResponse(req);
    const chunks = [];
    let settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      resolve({
        status: res.statusCode || 200,
        headers: res.getHeaders(),
        body: Buffer.concat(chunks),
      });
    }
    res.write = (chunk, encoding, callback) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      if (typeof callback === "function") callback();
      return true;
    };
    res.end = (chunk, encoding, callback) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      if (typeof callback === "function") callback();
      finish();
      return res;
    };
    try {
      app.handle(req, res, (error) => {
        if (error) reject(error);
        else finish();
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { invoke };
