import { prisma } from "@/lib/prisma";
import { deleteKeys } from "@/lib/s3";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const images = await prisma.image.findMany({ where: { galleryId: id } });
  const keys = images.flatMap(img => [img.keyOriginal, img.keyLarge, img.keyThumb].filter(Boolean) as string[]);

  if (keys.length) {
    try { await deleteKeys(keys); } catch (e) { console.error("S3 delete error:", e); }
  }

  await prisma.image.deleteMany({ where: { galleryId: id } });
  await prisma.gallery.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
