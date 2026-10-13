import { spawn } from "node:child_process";

const webPort = process.env.WEB_PORT || "3000";
const api = spawn("npm", ["run", "start"], { cwd: "server", stdio: "inherit" });
const web = spawn("npx", ["next", "start", "-p", webPort, "-H", "127.0.0.1"], { stdio: "inherit" });

function shutdown() {
  api.kill("SIGTERM");
  web.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
