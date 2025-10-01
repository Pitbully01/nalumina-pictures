import { prisma } from "@/lib/prisma";
import { getGetUrl } from "@/lib/s3";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.image.findMany({
      where: { galleryId: id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: { id: true, keyOriginal: true, keyLarge: true, keyThumb: true, createdAt: true },
    }),
    prisma.image.count({ where: { galleryId: id } }),
  ]);

  const withUrls = await Promise.all(
    items.map(async (img) => {
      const key = img.keyThumb || img.keyLarge || img.keyOriginal;
      const url = await getGetUrl(key);
      return { id: img.id, url, createdAt: img.createdAt };
    })
  );

  return Response.json({
    items: withUrls,
    page,
    limit,
    total,
    hasMore: skip + items.length < total,
  });
}
