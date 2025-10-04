import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// === S3 Client Configuration ===
export const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true, // Important for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

// === Signed URL Functions ===
export async function getPutUrl(key: string, contentType: string) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 60 }
  );
}

export async function getGetUrl(key: string) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    }),
    { expiresIn: 60 }
  );
}

// === Object Operations ===
export async function getObjectBuffer(key: string) {
  const response = await s3.send(new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  }));

  const chunks: Uint8Array[] = [];
  // @ts-ignore - Node stream
  for await (const chunk of response.Body) {
    chunks.push(chunk as Uint8Array);
  }

  return Buffer.concat(chunks);
}

export async function putObjectBuffer(key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function deleteKeys(keys: string[]) {
  if (!keys.length) return;

  await s3.send(new DeleteObjectsCommand({
    Bucket: process.env.S3_BUCKET!,
    Delete: { 
      Objects: keys.map(Key => ({ Key })) 
    },
  }));
}