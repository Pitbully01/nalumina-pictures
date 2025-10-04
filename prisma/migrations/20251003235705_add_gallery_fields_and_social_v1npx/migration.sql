/*
  Warnings:

  - The values [REJECT,STAR] on the enum `ReactionKind` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `authorId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `authorName` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `exifJson` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `byEmail` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `byUserId` on the `Reaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Gallery` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imageId,userId]` on the table `Reaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `text` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - The required column `slug` was added to the `Gallery` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `userId` to the `Reaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ColorLabel" AS ENUM ('RED', 'YELLOW', 'GREEN', 'BLUE', 'PURPLE');

-- AlterEnum
BEGIN;
CREATE TYPE "ReactionKind_new" AS ENUM ('LIKE', 'DISLIKE');
ALTER TABLE "Reaction" ALTER COLUMN "kind" TYPE "ReactionKind_new" USING ("kind"::text::"ReactionKind_new");
ALTER TYPE "ReactionKind" RENAME TO "ReactionKind_old";
ALTER TYPE "ReactionKind_new" RENAME TO "ReactionKind";
DROP TYPE "public"."ReactionKind_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "authorId",
DROP COLUMN "authorName",
DROP COLUMN "body",
ADD COLUMN     "text" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN     "coverKey" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "visibility" SET DEFAULT 'LINK';

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "exifJson",
ADD COLUMN     "colorLabel" "ColorLabel",
ADD COLUMN     "imageIndex" INTEGER,
ALTER COLUMN "keyLarge" DROP NOT NULL,
ALTER COLUMN "keyThumb" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "byEmail",
DROP COLUMN "byUserId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Gallery_slug_key" ON "Gallery"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_imageId_userId_key" ON "Reaction"("imageId", "userId");

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
