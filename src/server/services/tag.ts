import type { Prisma } from "@prisma/client";
import { serialize } from "@/lib/serialize";
import { db } from "@/server/db";

export async function listTags(userId: string) {
  return serialize(await db.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }));
}

export async function upsertTags(tx: Prisma.TransactionClient, userId: string, names: string[]) {
  const normalized = [...new Set(names.map((name) => name.trim()).filter(Boolean)
    .reduce<string[]>((items, name) => items.some((item) => item.toLowerCase() === name.toLowerCase()) ? items : [...items, name], []))];
  const ids: string[] = [];
  for (const name of normalized) {
    const existing = await tx.tag.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    const tag = existing ?? await tx.tag.create({ data: { userId, name } });
    ids.push(tag.id);
  }
  return ids;
}
