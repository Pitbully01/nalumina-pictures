import { prisma } from "@/lib/prisma";

// ===== GALLERY OPERATIONS =====
export async function GET() {
  const galleries = await prisma.gallery.findMany({
    orderBy: { createdAt: "desc" },
  });
  
  return Response.json(galleries);
}

export async function POST(req: Request) {
  const { title } = await req.json();

  // Für jetzt: Dummy-User (später Auth)
  const user = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: { 
      email: "owner@example.com", 
      name: "Owner" 
    },
  });

  const gallery = await prisma.gallery.create({
    data: {
      title,
      ownerId: user.id,
      visibility: "LINK",
    },
  });

  return Response.json(gallery, { status: 201 });
}
