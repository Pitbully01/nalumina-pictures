import { prisma } from "@/lib/prisma";

// === POST - Create new image record ===
export async function POST(req: Request) {
  const { galleryId, key } = await req.json();

  // Validate required fields
  if (!galleryId || !key) {
    return new Response("Missing fields", { status: 400 });
  }

  // Create image record
  const image = await prisma.image.create({
    data: {
      galleryId,
      keyOriginal: key,
      keyLarge: key,    // Initially same; thumbs will be generated later
      keyThumb: key,    // Initially same; thumbs will be generated later
      width: 0,
      height: 0,
    },
  });

  return Response.json(image, { status: 201 });
}
