import { Prisma } from "@prisma/client";
import { serialize } from "@/lib/serialize";
import { getNextRunDate } from "@/lib/recurring";
import { recurringSchema, recurringUpdateSchema } from "@/lib/validations/recurring";
import { AppError, notFound } from "@/server/errors";
import { db } from "@/server/db";
import { createTransaction } from "@/server/services/transaction";

export async function listRecurring(userId: string) {
  return serialize(
    await db.recurringTransaction.findMany({
      where: { userId },
      include: { account: true, toAccount: true, category: true },
      orderBy: { nextRunDate: "asc" },
    }),
  );
}

export async function createRecurring(userId: string, input: unknown) {
  const data = recurringSchema.parse(input);
  if (data.type === "TRANSFER" && !data.categoryId) {
    const category = await db.category.findFirst({
      where: { userId, type: "TRANSFER", name: "Transfer" },
    });
    data.categoryId = category?.id || null;
  }
  await validateRecurringReferences(userId, data);
  const nextRunDate = getNextRunDate(data.startDate, data.frequency, data.interval);
  return serialize(
    await db.recurringTransaction.create({
      data: {
        ...data,
        userId,
        amount: new Prisma.Decimal(data.amount),
        nextRunDate,
        tagNames: data.tagNames || null,
      },
    }),
  );
}

export async function updateRecurring(userId: string, id: string, input: Record<string, unknown>) {
  const owned = await db.recurringTransaction.findFirst({ where: { id, userId } });
  if (!owned) throw notFound("Transaksi berulang tidak ditemukan");
  const parsed = recurringUpdateSchema.parse(input);
  const merged = recurringSchema.parse({
    ...owned,
    ...parsed,
    amount: parsed.amount ?? Number(owned.amount),
  });
  await validateRecurringReferences(userId, merged);
  const scheduleChanged =
    parsed.startDate !== undefined ||
    parsed.frequency !== undefined ||
    parsed.interval !== undefined;
  const result = await db.recurringTransaction.updateMany({
    where: { id, userId },
    data: {
      ...parsed,
      ...(parsed.amount !== undefined ? { amount: new Prisma.Decimal(parsed.amount) } : {}),
      ...(scheduleChanged
        ? {
            nextRunDate: getNextRunDate(
              owned.lastRunDate || merged.startDate,
              merged.frequency,
              merged.interval,
            ),
          }
        : {}),
    },
  });
  if (!result.count) throw notFound("Transaksi berulang tidak ditemukan");
  return serialize(await db.recurringTransaction.findUniqueOrThrow({ where: { id } }));
}

async function validateRecurringReferences(
  userId: string,
  data: {
    type: string;
    accountId: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    subCategoryId?: string | null;
  },
) {
  const account = await db.account.findFirst({ where: { id: data.accountId, userId } });
  if (!account) throw notFound("Akun tidak ditemukan");
  if (account.isArchived) throw new AppError(422, "Akun yang diarsipkan tidak dapat digunakan");
  if (data.toAccountId) {
    if (data.toAccountId === data.accountId)
      throw new AppError(400, "Akun tujuan harus berbeda dari akun asal");
    const destination = await db.account.findFirst({ where: { id: data.toAccountId, userId } });
    if (!destination) throw notFound("Akun tujuan tidak ditemukan");
    if (destination.isArchived)
      throw new AppError(422, "Akun tujuan yang diarsipkan tidak dapat digunakan");
  }
  if (data.categoryId) {
    const category = await db.category.findFirst({ where: { id: data.categoryId, userId } });
    if (!category) throw notFound("Kategori tidak ditemukan");
    if (category.type !== data.type) throw new AppError(400, "Jenis kategori tidak sesuai");
  }
  if (data.subCategoryId) {
    if (!data.categoryId) throw notFound("Subkategori tidak sesuai dengan kategori");
    const sub = await db.subCategory.findFirst({
      where: { id: data.subCategoryId, categoryId: data.categoryId, category: { userId } },
    });
    if (!sub) throw notFound("Subkategori tidak ditemukan");
  }
}

export async function deleteRecurring(userId: string, id: string) {
  const result = await db.recurringTransaction.deleteMany({ where: { id, userId } });
  if (!result.count) throw notFound("Transaksi berulang tidak ditemukan");
  return { id };
}

export async function processDueRecurring(userId: string, now = new Date()) {
  const dueRules = await db.recurringTransaction.findMany({
    where: { userId, isActive: true, nextRunDate: { lte: now } },
    orderBy: { nextRunDate: "asc" },
  });
  let created = 0;
  const failed: { recurringId: string; message: string }[] = [];
  for (const rule of dueRules) {
    let nextRunDate = rule.nextRunDate;
    let lastRunDate = rule.lastRunDate;
    let count = 0;
    try {
      while (nextRunDate <= now && count < 60) {
        if (rule.endDate && nextRunDate > rule.endDate) {
          await db.recurringTransaction.update({
            where: { id: rule.id },
            data: { isActive: false },
          });
          break;
        }
        await createTransaction(
          userId,
          {
            type: rule.type,
            amount: Number(rule.amount),
            date: nextRunDate,
            accountId: rule.accountId,
            toAccountId: rule.toAccountId,
            categoryId: rule.categoryId,
            subCategoryId: rule.subCategoryId,
            note: rule.note,
            tags:
              rule.tagNames
                ?.split(",")
                .map((name) => name.trim())
                .filter(Boolean) || [],
          },
          rule.id,
        );
        lastRunDate = nextRunDate;
        nextRunDate = getNextRunDate(nextRunDate, rule.frequency, rule.interval);
        count += 1;
        created += 1;
        await db.recurringTransaction.update({
          where: { id: rule.id },
          data: {
            lastRunDate,
            nextRunDate,
            ...(rule.endDate && nextRunDate > rule.endDate ? { isActive: false } : {}),
          },
        });
        if (rule.endDate && nextRunDate > rule.endDate) break;
      }
    } catch (error) {
      failed.push({
        recurringId: rule.id,
        message: error instanceof Error ? error.message : "Transaksi berulang gagal dibuat",
      });
    }
  }
  return { created, failed };
}

export async function processAllDueRecurring(now = new Date()) {
  const users = await db.recurringTransaction.findMany({
    where: { isActive: true, nextRunDate: { lte: now } },
    select: { userId: true },
    distinct: ["userId"],
  });
  const results = [];
  for (const { userId } of users) {
    results.push({ userId, ...(await processDueRecurring(userId, now)) });
  }
  return results;
}
