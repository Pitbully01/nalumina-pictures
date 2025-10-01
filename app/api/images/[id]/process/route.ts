import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { getObjectBuffer, putObjectBuffer } from "@/lib/s3";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const img = await prisma.image.findUnique({ where: { id } });
  if (!img) return new Response("Not found", { status: 404 });

  const orig = await getObjectBuffer(img.keyOriginal);

  const meta = await sharp(orig).metadata();
  const large = await sharp(orig).resize({ width: 2048, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const thumb = await sharp(orig).resize({ width: 400, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();

  const keyLarge = `${img.keyOriginal}.lg.webp`;
  const keyThumb = `${img.keyOriginal}.th.webp`;

  await Promise.all([
    putObjectBuffer(keyLarge, large, "image/webp"),
    putObjectBuffer(keyThumb, thumb, "image/webp"),
  ]);

  const updated = await prisma.image.update({
    where: { id },
    data: {
      keyLarge,
      keyThumb,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    },
  });

  return Response.json(updated);
}
