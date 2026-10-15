import { Prisma } from "@prisma/client";
import { getBudgetStatus } from "@/lib/budget";
import { budgetSchema, budgetUpdateSchema } from "@/lib/validations/budget";
import { serialize } from "@/lib/serialize";
import { AppError, notFound } from "@/server/errors";
import { db } from "@/server/db";

function monthRange(year: number, month: number) {
  return {
    from: new Date(year, month - 1, 1),
    to: new Date(year, month, 1),
  };
}

async function validateExpenseCategory(userId: string, categoryId: string) {
  const category = await db.category.findFirst({
    where: { id: categoryId, userId, type: "EXPENSE" },
    select: { id: true },
  });
  if (!category) throw notFound("Kategori pengeluaran tidak ditemukan");
}

async function spentByCategory(userId: string, categoryIds: string[], year: number, month: number) {
  if (categoryIds.length === 0) return new Map<string, number>();
  const range = monthRange(year, month);
  const totals = await db.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "EXPENSE",
      categoryId: { in: categoryIds },
      date: { gte: range.from, lt: range.to },
    },
    _sum: { amount: true },
  });
  return new Map(totals.map((row) => [row.categoryId!, Number(row._sum.amount || 0)]));
}

export async function listBudgets(userId: string, year: number, month: number) {
  const budgets = await db.budget.findMany({
    where: { userId, year, month },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });
  const spent = await spentByCategory(
    userId,
    budgets.map((budget) => budget.categoryId),
    year,
    month,
  );
  const items = budgets.map((budget) => {
    const status = getBudgetStatus(
      spent.get(budget.categoryId) || 0,
      Number(budget.amount),
      budget.alertThreshold,
    );
    return {
      ...budget,
      amount: Number(budget.amount),
      spent: spent.get(budget.categoryId) || 0,
      ...status,
    };
  });
  return serialize({
    items,
    year,
    month,
    totalBudget: items.reduce((sum, item) => sum + item.amount, 0),
    totalSpent: items.reduce((sum, item) => sum + item.spent, 0),
    totalRemaining: items.reduce((sum, item) => sum + item.remaining, 0),
  });
}

export async function createBudget(userId: string, input: unknown) {
  const data = budgetSchema.parse(input);
  await validateExpenseCategory(userId, data.categoryId);
  try {
    const budget = await db.budget.create({
      data: { ...data, userId, amount: new Prisma.Decimal(data.amount) },
      include: { category: true },
    });
    return serialize(budget);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "Anggaran untuk kategori dan bulan ini sudah ada", "BUDGET_EXISTS");
    }
    throw error;
  }
}

export async function updateBudget(userId: string, id: string, input: unknown) {
  const owned = await db.budget.findFirst({ where: { id, userId } });
  if (!owned) throw notFound("Anggaran tidak ditemukan");
  const data = budgetUpdateSchema.parse(input);
  if (data.categoryId) await validateExpenseCategory(userId, data.categoryId);
  try {
    return serialize(
      await db.budget.update({
        where: { id },
        data: {
          ...data,
          ...(data.amount !== undefined ? { amount: new Prisma.Decimal(data.amount) } : {}),
        },
        include: { category: true },
      }),
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "Anggaran untuk kategori dan bulan ini sudah ada", "BUDGET_EXISTS");
    }
    throw error;
  }
}

export async function deleteBudget(userId: string, id: string) {
  const result = await db.budget.deleteMany({ where: { id, userId } });
  if (!result.count) throw notFound("Anggaran tidak ditemukan");
  return { id };
}

export async function copyPreviousMonthBudgets(userId: string, year: number, month: number) {
  const previous = new Date(year, month - 2, 1);
  const source = await db.budget.findMany({
    where: { userId, year: previous.getFullYear(), month: previous.getMonth() + 1 },
  });
  if (!source.length) return { copied: 0, skipped: 0 };
  const existing = await db.budget.findMany({
    where: { userId, year, month },
    select: { categoryId: true },
  });
  const existingCategories = new Set(existing.map((budget) => budget.categoryId));
  const candidates = source.filter((budget) => !existingCategories.has(budget.categoryId));
  if (candidates.length) {
    await db.budget.createMany({
      data: candidates.map((budget) => ({
        userId,
        categoryId: budget.categoryId,
        year,
        month,
        amount: budget.amount,
        alertThreshold: budget.alertThreshold,
        note: budget.note,
      })),
      skipDuplicates: true,
    });
  }
  const created = await db.budget.count({
    where: { userId, year, month, categoryId: { in: candidates.map((item) => item.categoryId) } },
  });
  return { copied: created, skipped: source.length - created };
}

export async function budgetHistory(
  userId: string,
  categoryId: string,
  year: number,
  month: number,
) {
  await validateExpenseCategory(userId, categoryId);
  const months = Array.from({ length: 6 }, (_, index) => new Date(year, month - 6 + index, 1));
  const rows = await Promise.all(
    months.map(async (date) => {
      const currentYear = date.getFullYear();
      const currentMonth = date.getMonth() + 1;
      const [budget, spent] = await Promise.all([
        db.budget.findFirst({
          where: { userId, categoryId, year: currentYear, month: currentMonth },
        }),
        spentByCategory(userId, [categoryId], currentYear, currentMonth),
      ]);
      return {
        year: currentYear,
        month: currentMonth,
        label: date.toLocaleDateString("id-ID", { month: "short" }),
        budget: Number(budget?.amount || 0),
        spent: spent.get(categoryId) || 0,
      };
    }),
  );
  return serialize(rows);
}
