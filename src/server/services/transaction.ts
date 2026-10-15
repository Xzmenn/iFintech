import { Prisma } from "@prisma/client";
import { getBudgetStatus } from "@/lib/budget";
import { serialize } from "@/lib/serialize";
import { transactionQuerySchema } from "@/lib/validations/transaction";
import { AppError, notFound } from "@/server/errors";
import { db, textContains, textEquals } from "@/server/db";
import { recalculateBalances } from "@/server/services/balance";
import { upsertTags } from "@/server/services/tag";

const transactionInclude = {
  account: true,
  toAccount: true,
  category: true,
  subCategory: true,
  tags: { include: { tag: true } },
  attachments: true,
} satisfies Prisma.TransactionInclude;

type TransactionInput = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: Date;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  note?: string | null;
  tags?: string[];
};

async function validateReferences(
  tx: Prisma.TransactionClient,
  userId: string,
  input: TransactionInput,
) {
  const account = await tx.account.findFirst({ where: { id: input.accountId, userId } });
  if (!account) throw notFound("Akun tidak ditemukan");
  if (account.isArchived) throw new AppError(422, "Akun yang diarsipkan tidak dapat digunakan");
  if (input.type === "TRANSFER") {
    if (!input.toAccountId || input.toAccountId === input.accountId) {
      throw new AppError(400, "Akun tujuan transfer harus berbeda dari akun asal");
    }
    const destination = await tx.account.findFirst({ where: { id: input.toAccountId, userId } });
    if (!destination) throw notFound("Akun tujuan tidak ditemukan");
    if (destination.isArchived)
      throw new AppError(422, "Akun tujuan yang diarsipkan tidak dapat digunakan");
  }
  let categoryId = input.categoryId || null;
  if (input.type === "TRANSFER" && !categoryId) {
    const transferCategory = await tx.category.findFirst({
      where: { userId, name: "Transfer", type: "TRANSFER" },
    });
    categoryId = transferCategory?.id || null;
  }
  if (categoryId) {
    const category = await tx.category.findFirst({ where: { id: categoryId, userId } });
    if (!category) throw notFound("Kategori tidak ditemukan");
    if (category.type !== input.type)
      throw new AppError(400, "Jenis kategori tidak sesuai dengan transaksi");
  } else if (input.type !== "TRANSFER") {
    throw new AppError(400, "Kategori wajib dipilih");
  }
  if (input.subCategoryId) {
    if (!categoryId) throw notFound("Subkategori tidak sesuai dengan kategori");
    const subCategory = await tx.subCategory.findFirst({
      where: { id: input.subCategoryId, categoryId, category: { userId } },
    });
    if (!subCategory) throw notFound("Subkategori tidak sesuai dengan kategori");
  }
  return { ...input, categoryId };
}

async function attachTags(
  tx: Prisma.TransactionClient,
  userId: string,
  transactionId: string,
  names: string[],
) {
  const tagIds = await upsertTags(tx, userId, names);
  await tx.transactionTag.deleteMany({ where: { transactionId } });
  if (tagIds.length) {
    await tx.transactionTag.createMany({ data: tagIds.map((tagId) => ({ transactionId, tagId })) });
  }
}

async function warningsFor(
  userId: string,
  transaction: {
    type: string;
    categoryId: string | null;
    date: Date;
  },
) {
  if (transaction.type !== "EXPENSE" || !transaction.categoryId) return [];
  const year = transaction.date.getFullYear();
  const month = transaction.date.getMonth() + 1;
  const budget = await db.budget.findFirst({
    where: { userId, categoryId: transaction.categoryId, year, month },
    include: { category: { select: { name: true } } },
  });
  if (!budget) return [];
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const result = await db.transaction.aggregate({
    where: {
      userId,
      categoryId: transaction.categoryId,
      type: "EXPENSE",
      date: { gte: start, lt: end },
    },
    _sum: { amount: true },
  });
  const status = getBudgetStatus(
    Number(result._sum.amount || 0),
    Number(budget.amount),
    budget.alertThreshold,
  );
  return status.status === "aman"
    ? []
    : [
        {
          categoryName: budget.category.name,
          percent: status.percent,
          status: status.status,
        },
      ];
}

export async function createTransaction(
  userId: string,
  input: TransactionInput,
  recurringId?: string,
) {
  const transaction = await db.$transaction(async (tx) => {
    const safe = await validateReferences(tx, userId, input);
    const created = await tx.transaction.create({
      data: {
        userId,
        type: safe.type,
        amount: new Prisma.Decimal(safe.amount),
        date: safe.date,
        accountId: safe.accountId,
        toAccountId: safe.toAccountId,
        categoryId: safe.categoryId,
        subCategoryId: safe.subCategoryId,
        note: safe.note,
        recurringId,
      },
    });
    await attachTags(tx, userId, created.id, safe.tags || []);
    await recalculateBalances(
      tx,
      userId,
      [safe.accountId, safe.toAccountId].filter((id): id is string => Boolean(id)),
    );
    return tx.transaction.findUniqueOrThrow({
      where: { id: created.id },
      include: transactionInclude,
    });
  });
  const warnings = await warningsFor(userId, transaction);
  return { transaction: serialize(transaction), warnings };
}

export async function getTransaction(userId: string, id: string) {
  const transaction = await db.transaction.findFirst({
    where: { id, userId },
    include: transactionInclude,
  });
  if (!transaction) throw notFound("Transaksi tidak ditemukan");
  return serialize(transaction);
}

export async function listTransactions(userId: string, params: URLSearchParams) {
  const query = transactionQuerySchema.parse(Object.fromEntries(params.entries()));
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(query.type ? { type: query.type } : {}),
    ...(query.accountId
      ? { OR: [{ accountId: query.accountId }, { toAccountId: query.accountId }] }
      : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.from || query.to
      ? {
          date: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
    ...(query.minAmount !== undefined || query.maxAmount !== undefined
      ? {
          amount: {
            ...(query.minAmount !== undefined ? { gte: new Prisma.Decimal(query.minAmount) } : {}),
            ...(query.maxAmount !== undefined ? { lte: new Prisma.Decimal(query.maxAmount) } : {}),
          },
        }
      : {}),
    ...(query.q
      ? {
          AND: [
            {
              OR: [
                { note: textContains(query.q) },
                { category: { name: textContains(query.q) } },
                { account: { name: textContains(query.q) } },
                { toAccount: { name: textContains(query.q) } },
                { tags: { some: { tag: { name: textContains(query.q) } } } },
              ],
            },
          ],
        }
      : {}),
    ...(query.tag ? { tags: { some: { tag: { name: textEquals(query.tag) } } } } : {}),
  };
  const [items, total] = await db.$transaction([
    db.transaction.findMany({
      where,
      include: transactionInclude,
      orderBy: [{ [query.sort]: query.order }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.transaction.count({ where }),
  ]);
  return { items: serialize(items), total, page: query.page, pageSize: query.pageSize };
}

export async function updateTransaction(
  userId: string,
  id: string,
  changes: Partial<TransactionInput>,
) {
  const transaction = await db.$transaction(async (tx) => {
    const current = await tx.transaction.findFirst({
      where: { id, userId },
      include: { tags: { include: { tag: true } } },
    });
    if (!current) throw notFound("Transaksi tidak ditemukan");
    const merged: TransactionInput = {
      type: changes.type ?? current.type,
      amount: changes.amount ?? Number(current.amount),
      date: changes.date ?? current.date,
      accountId: changes.accountId ?? current.accountId,
      toAccountId: changes.toAccountId === undefined ? current.toAccountId : changes.toAccountId,
      categoryId: changes.categoryId === undefined ? current.categoryId : changes.categoryId,
      subCategoryId:
        changes.subCategoryId === undefined ? current.subCategoryId : changes.subCategoryId,
      note: changes.note === undefined ? current.note : changes.note,
      tags: changes.tags ?? current.tags.map(({ tag }) => tag.name),
    };
    const safe = await validateReferences(tx, userId, merged);
    await tx.transaction.update({
      where: { id },
      data: {
        type: safe.type,
        amount: new Prisma.Decimal(safe.amount),
        date: safe.date,
        accountId: safe.accountId,
        toAccountId: safe.toAccountId,
        categoryId: safe.categoryId,
        subCategoryId: safe.subCategoryId,
        note: safe.note,
      },
    });
    await attachTags(tx, userId, id, safe.tags || []);
    await recalculateBalances(
      tx,
      userId,
      [current.accountId, current.toAccountId, safe.accountId, safe.toAccountId].filter(
        (accountId): accountId is string => Boolean(accountId),
      ),
    );
    return tx.transaction.findUniqueOrThrow({ where: { id }, include: transactionInclude });
  });
  const warnings = await warningsFor(userId, transaction);
  return { transaction: serialize(transaction), warnings };
}

export async function deleteTransaction(userId: string, id: string) {
  return db.$transaction(async (tx) => {
    const current = await tx.transaction.findFirst({ where: { id, userId } });
    if (!current) throw notFound("Transaksi tidak ditemukan");
    await tx.transaction.delete({ where: { id } });
    await recalculateBalances(
      tx,
      userId,
      [current.accountId, current.toAccountId].filter((id): id is string => Boolean(id)),
    );
    return { id };
  });
}
