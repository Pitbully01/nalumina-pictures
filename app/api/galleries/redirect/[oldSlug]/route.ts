import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// === SLUG REDIRECT LOOKUP ===
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ oldSlug: string }> }
) {
  const { oldSlug } = await ctx.params;

  // Look for redirect
  const redirect = await prisma.slugRedirect.findUnique({
    where: { oldSlug },
    select: {
      gallery: {
        select: { slug: true }
      }
    }
  });

  if (!redirect) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ 
    newSlug: redirect.gallery.slug 
  });
}
