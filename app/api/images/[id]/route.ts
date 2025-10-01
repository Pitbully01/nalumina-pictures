import { PrismaClient } from '@prisma/client';
import { getGetUrl } from '@/lib/s3';

const prisma = new PrismaClient();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const img = await prisma.image.findUnique({ where: { id } });
  if (!img) return new Response("Not found", { status: 404 });
  const url = await getGetUrl(img.keyOriginal);
  return Response.json({ ...img, url });
}