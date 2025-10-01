import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const images = await prisma.image.findMany({
      where: { galleryId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, keyOriginal: true, createdAt: true },
    });
    return Response.json(images);
}