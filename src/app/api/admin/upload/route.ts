import { cookies } from "next/headers";
import { addProductImages } from "../../../../../server/catalog.js";
import { uploadImage, configured } from "../../../../../server/cloudinary.js";
import { verify } from "../../../../../server/admin-auth.js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = (await cookies()).get("rai_admin")?.value;
  if (!verify(token)) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!configured()) return Response.json({ error: "Cloudinary is not configured." }, { status: 500 });

  const form = await request.formData();
  const erpId = String(form.get("erpId") || "");
  const files = form.getAll("file").filter((item): item is File => item instanceof File);
  if (!erpId || !files.length) return Response.json({ error: "Choose a product and at least one image." }, { status: 400 });

  const images = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    images.push(await uploadImage(buffer, "phonestore/products", erpId));
  }
  await addProductImages(erpId, images);
  return Response.json({ ok: true, images });
}
