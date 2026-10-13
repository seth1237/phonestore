import { callApi } from "@/lib/embedded-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function webHeaders(headers: Record<string, string | number | string[] | undefined>) {
  const out = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) out.append(key, String(item));
    } else {
      out.set(key, String(value));
    }
  }
  return out;
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const result = await callApi(request.method, `${url.pathname}${url.search}`, {
    headers,
    body: Buffer.from(await request.arrayBuffer()),
  });
  return new Response(new Uint8Array(result.body), {
    status: result.status,
    headers: webHeaders(result.headers),
  });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
export const OPTIONS = handle;
