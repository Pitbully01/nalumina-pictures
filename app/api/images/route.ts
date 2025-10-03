import { prisma } from "@/lib/prisma";

// ===== IMAGE OPERATIONS =====
export async function POST(req: Request) {
  const { galleryId, key } = await req.json();
  
  if (!galleryId || !key) {
    return new Response("Missing fields", { status: 400 });
  }

  const image = await prisma.image.create({
    data: {
      galleryId,
      keyOriginal: key,
      keyLarge: key,  // vorerst gleich; Thumbs kommen später
      keyThumb: key,  // vorerst gleich
      width: 0,
      height: 0,
    },
  });

  return Response.json(image, { status: 201 });
}
