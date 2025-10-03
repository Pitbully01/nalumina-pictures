import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getObjectBuffer, putObjectBuffer } from "@/lib/s3";

// ===== IMAGE PROCESSING =====
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  
  const image = await prisma.image.findUnique({ 
    where: { id } 
  });
  
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  // Get original image from S3
  const originalBuffer = await getObjectBuffer(image.keyOriginal);

  // Get image metadata
  const metadata = await sharp(originalBuffer).metadata();
  
  // Generate large and thumbnail versions
  const largeBuffer = await sharp(originalBuffer)
    .resize({ width: 2048, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
    
  const thumbBuffer = await sharp(originalBuffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // Generate S3 keys for processed images
  const keyLarge = `${image.keyOriginal}.lg.webp`;
  const keyThumb = `${image.keyOriginal}.th.webp`;

  // Upload processed images to S3
  await Promise.all([
    putObjectBuffer(keyLarge, largeBuffer, "image/webp"),
    putObjectBuffer(keyThumb, thumbBuffer, "image/webp"),
  ]);

  // Update database with processed image keys and metadata
  const updatedImage = await prisma.image.update({
    where: { id },
    data: {
      keyLarge,
      keyThumb,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    },
  });

  return Response.json(updatedImage);
}
