import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getGetUrl } from "@/lib/s3";
import { generateUniqueSlug } from "@/lib/slug";

// === GET - Fetch gallery with paginated images ===
export async function GET(
  req: Request, 
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  // Parse pagination parameters
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "24")));
  const skip = (page - 1) * limit;

  // Find gallery
  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    select: { 
      id: true, 
      title: true, 
      slug: true, 
      isPublic: true,
      showIndexOverlay: true,
      coverKey: true
    },
  });

  if (!gallery) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch images and total count
  const [items, total] = await Promise.all([
    prisma.image.findMany({
      where: { galleryId: gallery.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: { 
        id: true, 
        keyOriginal: true, 
        keyLarge: true, 
        keyThumb: true 
      },
    }),
    prisma.image.count({ 
      where: { galleryId: gallery.id } 
    }),
  ]);

  // Generate signed URLs for images
  const withUrls = await Promise.all(items.map(async (img) => {
    const key = img.keyThumb || img.keyLarge || img.keyOriginal;
    const url = await getGetUrl(key);
    return { id: img.id, url };
  }));

  return NextResponse.json({
    gallery,
    items: withUrls,
    page,
    limit,
    total,
    hasMore: skip + items.length < total,
  });
}

// === PATCH - Update gallery settings ===
export async function PATCH(
  req: Request, 
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  const body = await req.json();

  // Find the gallery first to get its ID
  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    select: { id: true, slug: true }
  });

  if (!gallery) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Build update data object
  const data: any = {};
  if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
  if (typeof body.showIndexOverlay === "boolean") data.showIndexOverlay = body.showIndexOverlay;
  if (body.coverKey === null || typeof body.coverKey === "string") data.coverKey = body.coverKey;

  // Handle title update with slug generation
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
    
    // Generate new unique slug
    const newSlug = await generateUniqueSlug(data.title, gallery.id);
    
    if (newSlug !== gallery.slug) {
      // Slug is changing, create redirect
      await prisma.slugRedirect.create({
        data: {
          oldSlug: gallery.slug,
          galleryId: gallery.id
        }
      });
      
      data.slug = newSlug;
    }
  }

  // Validate that at least one field is provided
  if (!Object.keys(data).length) {
    return NextResponse.json(
      { error: "No valid fields" }, 
      { status: 400 }
    );
  }

  // Update gallery
  const updatedGallery = await prisma.gallery.update({
    where: { id: gallery.id },
    data,
    select: { 
      id: true, 
      title: true, 
      slug: true, 
      isPublic: true,
      showIndexOverlay: true,
      coverKey: true
    },
  });

  return NextResponse.json({ gallery: updatedGallery });
}