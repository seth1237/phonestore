import "server-only";
import { createApp } from "../../server/index.js";
import { invoke } from "../../server/invoke.js";

type HeaderValue = string | number | string[] | undefined;

export async function callApi(method: string, path: string, init: { headers?: Record<string, string>; body?: Buffer | string } = {}) {
  const app = await createApp();
  const body = typeof init.body === "string" ? Buffer.from(init.body) : init.body || Buffer.alloc(0);
  const result = await invoke(app, {
    method,
    url: path,
    headers: { accept: "application/json", ...(init.headers || {}) },
    body,
  });
  return result as { status: number; headers: Record<string, HeaderValue>; body: Buffer };
}

export async function callApiJson<T>(method: string, path: string, init: { headers?: Record<string, string>; body?: string } = {}): Promise<T> {
  const result = await callApi(method, path, init);
  const text = result.body.toString("utf8");
  if (result.status >= 400) {
    throw new Error(`Shop API ${path} returned ${result.status}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}
