import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true, // wichtig für MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

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
