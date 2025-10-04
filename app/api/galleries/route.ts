import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";

// === GET - Fetch all galleries ===
export async function GET() {
  const galleries = await prisma.gallery.findMany({
    orderBy: { createdAt: "desc" },
    select: { 
      id: true, 
      title: true, 
      slug: true, 
      isPublic: true, 
      parentId: true 
    },
  });
  return Response.json(galleries);
}

// === POST - Create new gallery ===
export async function POST(req: Request) {
  try {
    const { title, slug: rawSlug, isPublic = false, parentSlug } = await req.json();

    // Validate title
    if (!title || typeof title !== "string") {
      return new Response("Missing title", { status: 400 });
    }

    // Generate or validate slug
    let slug: string;
    if (rawSlug?.trim()) {
      slug = rawSlug.trim();
    } else {
      slug = await generateUniqueSlug(title);
    }

    // If a custom slug was provided, ensure uniqueness
    if (rawSlug?.trim()) {
      const existing = await prisma.gallery.findUnique({ where: { slug } });
      if (existing) {
        slug = await generateUniqueSlug(rawSlug.trim());
      }
    }

    // Handle parent gallery
    let parentId: string | undefined;
    if (parentSlug) {
      const parent = await prisma.gallery.findUnique({ 
        where: { slug: String(parentSlug) } 
      });
      if (!parent) {
        return new Response("Parent not found", { status: 400 });
      }
      parentId = parent.id;
    }

    // TODO: Get ownerId from session – temporary: use first user
    const owner = await prisma.user.findFirst();
    if (!owner) {
      return new Response("No user exists. Create a user first.", { status: 400 });
    }

    // Create gallery
    const gallery = await prisma.gallery.create({
      data: { 
        title, 
        slug, 
        isPublic, 
        parentId, 
        ownerId: owner.id 
      },
      select: { 
        id: true, 
        title: true, 
        slug: true, 
        isPublic: true, 
        parentId: true 
      },
    });

    return Response.json(gallery, { status: 201 });
  } catch (error) {
    console.error("Gallery creation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
