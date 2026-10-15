import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const isSQLite = process.env.DATABASE_URL?.startsWith("file:") ?? false;

export function textContains(query: string) {
  return isSQLite ? { contains: query } : { contains: query, mode: "insensitive" as const };
}

export function textEquals(query: string) {
  return isSQLite ? { equals: query } : { equals: query, mode: "insensitive" as const };
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
