import { prisma } from "@/lib/prisma";

// === Slug Generation Utility ===
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")      // Remove accents
    .replace(/[^a-z0-9]+/g, "-")          // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "")              // Trim leading/trailing hyphens
    .replace(/-+/g, "-")                  // Collapse multiple hyphens
    || "galerie";                         // Fallback if result is empty
}

// === Unique Slug Generation ===
export async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  let baseSlug = slugify(title);
  let candidateSlug = baseSlug;
  let counter = 1;

  while (true) {
    // Check if slug exists (excluding the current gallery if updating)
    const existing = await prisma.gallery.findFirst({
      where: {
        slug: candidateSlug,
        ...(excludeId && { id: { not: excludeId } })
      }
    });

    if (!existing) {
      return candidateSlug;
    }

    // Generate next candidate with counter
    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }
}
