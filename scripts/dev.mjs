import { spawn } from "node:child_process";

const webPort = process.env.WEB_PORT || "3000";
const api = spawn("node", ["--env-file=.env", "server/index.js"], { stdio: "inherit" });
const web = spawn("npx", ["next", "dev", "-p", webPort, "-H", "127.0.0.1"], { stdio: "inherit" });

function shutdown() {
  api.kill("SIGTERM");
  web.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

api.on("exit", (code) => {
  console.error(`API exited (${code ?? "signal"}). The site is still running and calls ${process.env.NEXT_PUBLIC_API_URL || process.env.API_ORIGIN || "http://127.0.0.1:3001"}.`);
});

web.on("exit", (code) => {
  console.error(`Site exited (${code ?? "signal"}). The API is still running.`);
});
