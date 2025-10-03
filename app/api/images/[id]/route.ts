import { prisma } from "@/lib/prisma";
import { getGetUrl, deleteKeys } from "@/lib/s3";

// ===== IMAGE BY ID OPERATIONS =====
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  
  const image = await prisma.image.findUnique({ 
    where: { id } 
  });
  
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  const previewKey = image.keyThumb || image.keyLarge || image.keyOriginal;
  const fullKey = image.keyLarge || image.keyOriginal;

  const [previewUrl, fullUrl] = await Promise.all([
    getGetUrl(previewKey),
    getGetUrl(fullKey),
  ]);

  return Response.json({ 
    ...image, 
    url: previewUrl, 
    fullUrl 
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const image = await prisma.image.findUnique({ 
    where: { id } 
  });
  
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  // Collect all S3 keys for deletion
  const keys = [image.keyOriginal, image.keyLarge, image.keyThumb]
    .filter(Boolean) as string[];

  // Delete files from S3
  try {
    await deleteKeys(keys);
  } catch (error) {
    console.error("Error deleting from S3:", error);
  }

  // Delete image from database
  await prisma.image.delete({ 
    where: { id } 
  });

  return new Response(null, { status: 204 });
}