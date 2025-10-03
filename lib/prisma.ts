import { PrismaClient } from "@prisma/client";

// Global Prisma instance to prevent multiple connections in development
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = 
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}