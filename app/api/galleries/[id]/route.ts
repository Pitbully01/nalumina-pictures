import { prisma } from "@/lib/prisma";
import { deleteKeys } from "@/lib/s3";

// ===== GALLERY BY ID OPERATIONS =====
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // Get all images in the gallery
  const images = await prisma.image.findMany({ 
    where: { galleryId: id } 
  });

  // Collect all S3 keys for deletion
  const keys = images.flatMap(img => 
    [img.keyOriginal, img.keyLarge, img.keyThumb].filter(Boolean) as string[]
  );

  // Delete files from S3
  if (keys.length) {
    try {
      await deleteKeys(keys);
    } catch (error) {
      console.error("S3 delete error:", error);
    }
  }

  // Delete images and gallery from database
  await prisma.image.deleteMany({ 
    where: { galleryId: id } 
  });
  
  await prisma.gallery.delete({ 
    where: { id } 
  });

  return new Response(null, { status: 204 });
}
