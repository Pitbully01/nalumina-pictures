import { NextRequest } from "next/server";
import { getPutUrl } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const { galleryId, filename, contentType } = await req.json();

  if (!galleryId || !filename) {
    return new Response("Missing fields", { status: 400 });
  }

  const key = `g/${galleryId}/${crypto.randomUUID()}-${filename}`;
  const url = await getPutUrl(key, contentType || "application/octet-stream");

  return Response.json({ url, key });
}
