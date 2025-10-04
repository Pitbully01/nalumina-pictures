import { prisma } from "@/lib/prisma";
import { getGetUrl } from "@/lib/s3";

// Liefert öffentliche Galerien inkl. Cover-URL (coverKey oder auto aus ersten 4 Bildern)
export async function GET() {
  const gal = await prisma.gallery.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, coverKey: true,
      images: { take: 4, orderBy: { createdAt: "asc" }, select: { keyThumb: true, keyLarge: true, keyOriginal: true } },
    },
  });

  const items = await Promise.all(gal.map(async (g) => {
    if (g.coverKey) {
      // Manuelles Cover ist gesetzt
      return { title: g.title, slug: g.slug, cover: await getGetUrl(g.coverKey), mosaic: [] };
    }
    
    // Kein manuelles Cover - erstelle Mosaik oder nutze erstes Bild
    if (g.images.length === 0) {
      return { title: g.title, slug: g.slug, cover: null, mosaic: [] };
    }

    // Wenn 4+ Bilder vorhanden, zeige Mosaik
    if (g.images.length >= 4) {
      const mosaic = await Promise.all(
        g.images.slice(0, 4).map(async (im) => {
          const k = im.keyThumb || im.keyLarge || im.keyOriginal;
          return k ? await getGetUrl(k) : null;
        })
      );
      return { 
        title: g.title, 
        slug: g.slug, 
        cover: null, 
        mosaic: mosaic.filter(Boolean) as string[] 
      };
    }

    // Weniger als 4 Bilder - zeige das erste als Cover
    const first = g.images[0];
    const key = first.keyThumb || first.keyLarge || first.keyOriginal;
    const cover = key ? await getGetUrl(key) : null;
    return { title: g.title, slug: g.slug, cover, mosaic: [] };
  }));

  return Response.json(items);
}
