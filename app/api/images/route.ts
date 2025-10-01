import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { galleryId, key } = await req.json();
  if (!galleryId || !key) return new Response("Missing fields", { status: 400 });

  const img = await prisma.image.create({
    data: {
      galleryId,
      keyOriginal: key,
      keyLarge: key,  // vorerst gleich; Thumbs kommen später
      keyThumb: key,  // vorerst gleich
      width: 0,
      height: 0,
    },
  });

  return Response.json(img, { status: 201 });
}
