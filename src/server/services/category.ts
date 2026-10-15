import { serialize } from "@/lib/serialize";
import { notFound } from "@/server/errors";
import { db } from "@/server/db";

export async function listCategories(userId: string, type?: "INCOME" | "EXPENSE" | "TRANSFER") {
  const items = await db.category.findMany({
    where: { userId, ...(type ? { type } : {}) },
    include: { subCategories: { orderBy: { name: "asc" } } },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return serialize(items);
}

export async function createCategory(
  userId: string,
  input: {
    name: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    icon: string;
    color: string;
  },
) {
  return serialize(await db.category.create({ data: { ...input, userId } }));
}

export async function getCategory(userId: string, id: string) {
  const category = await db.category.findFirst({
    where: { id, userId },
    include: { subCategories: { orderBy: { name: "asc" } } },
  });
  if (!category) throw notFound("Kategori tidak ditemukan");
  return serialize(category);
}

export async function updateCategory(
  userId: string,
  id: string,
  input: {
    name?: string;
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    icon?: string;
    color?: string;
  },
) {
  const result = await db.category.updateMany({ where: { id, userId }, data: input });
  if (!result.count) throw notFound("Kategori tidak ditemukan");
  return serialize(
    await db.category.findUniqueOrThrow({ where: { id }, include: { subCategories: true } }),
  );
}

export async function deleteCategory(userId: string, id: string) {
  const result = await db.category.deleteMany({ where: { id, userId } });
  if (!result.count) throw notFound("Kategori tidak ditemukan");
  return { id };
}

export async function createSubCategory(userId: string, categoryId: string, name: string) {
  const category = await db.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
  if (!category) throw notFound("Kategori tidak ditemukan");
  return serialize(await db.subCategory.create({ data: { categoryId, name } }));
}

export async function updateSubCategory(userId: string, id: string, name: string) {
  const owned = await db.subCategory.findFirst({
    where: { id, category: { userId } },
    select: { id: true },
  });
  if (!owned) throw notFound("Subkategori tidak ditemukan");
  await db.subCategory.update({ where: { id }, data: { name } });
  return serialize(await db.subCategory.findUniqueOrThrow({ where: { id } }));
}

export async function deleteSubCategory(userId: string, id: string) {
  const result = await db.subCategory.deleteMany({ where: { id, category: { userId } } });
  if (!result.count) throw notFound("Subkategori tidak ditemukan");
  return { id };
}
