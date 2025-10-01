import { prisma } from "@/lib/prisma";
import { getGetUrl } from "@/lib/s3";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const img = await prisma.image.findUnique({ where: { id } });
  if (!img) return new Response("Not found", { status: 404 });

  // Falls vorhanden: Thumb, sonst Large, sonst Original
  const key = img.keyThumb || img.keyLarge || img.keyOriginal;
  const url = await getGetUrl(key);

  return Response.json({ ...img, url });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;

    const img = await prisma.image.findUnique({ where: { id }});
    if (!img) return new Response ("Not found", {status: 404});

    const keys = [img.keyOriginal, img.keyLarge, img.keyThumb].filter(Boolean) as string[];

    try {
      const { deleteKeys } = await import('@/lib/s3');
      await deleteKeys(keys);
    } catch (e) {
      console.error("Error deleting from S3:", e);
    }

    await prisma.image.delete({ where: { id }});

    return new Response(null, { status: 204 });
}