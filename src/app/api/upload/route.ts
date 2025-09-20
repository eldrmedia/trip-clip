import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  const s = await getServerSession();
  if (!s?.user) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file || file.size === 0) return new Response("No file", { status: 400 });

  // Optional: size guard (e.g., 20MB)
  if (file.size > 20 * 1024 * 1024) return new Response("Too large", { status: 413 });

  // Store under a user-scoped path
  const userId = (s.user as { id: string }).id;
  const key = `receipts/${userId}/${Date.now()}_${file.name}`;
  const { url } = await put(key, file, {
    access: "private", // or "public" if you want a public URL
  });

  return new Response(JSON.stringify({ url }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
