import { endOfDay, startOfDay } from "date-fns";
import { bucketCashflow, reconstructNetWorth } from "@/lib/reports";
import { serialize } from "@/lib/serialize";
import { db } from "@/server/db";
import { listBudgets } from "@/server/services/budget";

function getAmount(rows: { type: string; _sum: { amount: unknown } }[], type: string) {
  return Number(rows.find((row) => row.type === type)?._sum.amount || 0);
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export async function reportSummary(userId: string, from: Date, to: Date) {
  const start = startOfDay(from);
  const end = endOfDay(to);
  const duration = end.getTime() - start.getTime() + 1;
  const previousTo = new Date(start.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - duration + 1);
  const [accounts, current, previous, recentTransactions, budgets] = await Promise.all([
    db.account.findMany({ where: { userId }, select: { balance: true } }),
    db.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { gte: start, lte: end }, type: { in: ["INCOME", "EXPENSE"] } },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["type"],
      where: {
        userId,
        date: { gte: previousFrom, lte: previousTo },
        type: { in: ["INCOME", "EXPENSE"] },
      },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where: { userId },
      include: {
        account: true,
        toAccount: true,
        category: true,
        subCategory: true,
        tags: { include: { tag: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    listBudgets(userId, start.getFullYear(), start.getMonth() + 1),
  ]);
  const income = getAmount(current, "INCOME");
  const expense = getAmount(current, "EXPENSE");
  const previousIncome = getAmount(previous, "INCOME");
  const previousExpense = getAmount(previous, "EXPENSE");
  return {
    from: start,
    to: end,
    netWorth: accounts.reduce((sum, account) => sum + Number(account.balance), 0),
    income,
    expense,
    net: income - expense,
    changes: {
      income: percentageChange(income, previousIncome),
      expense: percentageChange(expense, previousExpense),
      net: percentageChange(income - expense, previousIncome - previousExpense),
    },
    previous: {
      income: previousIncome,
      expense: previousExpense,
      net: previousIncome - previousExpense,
    },
    budgetAlerts: budgets.items.filter((budget) => budget.status !== "aman"),
    recentTransactions: serialize(recentTransactions),
  };
}

export async function reportCategoryBreakdown(
  userId: string,
  from: Date,
  to: Date,
  type: "INCOME" | "EXPENSE",
) {
  const grouped = await db.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type,
      date: { gte: startOfDay(from), lte: endOfDay(to) },
    },
    _sum: { amount: true },
  });
  const categoryIds = grouped.flatMap((item) => (item.categoryId ? [item.categoryId] : []));
  const categories = await db.category.findMany({
    where: { userId, id: { in: categoryIds } },
    select: { id: true, name: true, icon: true, color: true },
  });
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const total = grouped.reduce((sum, item) => sum + Number(item._sum.amount || 0), 0);
  return {
    type,
    total,
    items: grouped
      .map((item) => {
        const category = item.categoryId ? categoryMap.get(item.categoryId) : null;
        const amount = Number(item._sum.amount || 0);
        return {
          categoryId: item.categoryId,
          name: category?.name || "Tanpa kategori",
          icon: category?.icon || "Wallet",
          color: category?.color || "#64748b",
          amount,
          percent: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((left, right) => right.amount - left.amount),
  };
}

export async function reportCashflow(userId: string, from: Date, to: Date) {
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      type: { in: ["INCOME", "EXPENSE"] },
      date: { gte: startOfDay(from), lte: endOfDay(to) },
    },
    select: { type: true, amount: true, date: true },
    orderBy: { date: "asc" },
  });
  const result = bucketCashflow(
    transactions.map((item) => ({
      type: item.type,
      amount: Number(item.amount),
      date: item.date,
    })),
    from,
    to,
  );
  return { from, to, ...result };
}

export async function reportNetWorth(userId: string, months: number) {
  const [accounts, transactions] = await Promise.all([
    db.account.findMany({
      where: { userId },
      select: { id: true, initialBalance: true, balance: true },
      orderBy: { createdAt: "asc" },
    }),
    db.transaction.findMany({
      where: { userId },
      select: { type: true, amount: true, date: true, accountId: true, toAccountId: true },
      orderBy: { date: "asc" },
    }),
  ]);
  return {
    currentNetWorth: accounts.reduce((sum, account) => sum + Number(account.balance), 0),
    items: reconstructNetWorth(
      accounts.map((account) => ({
        id: account.id,
        initialBalance: Number(account.initialBalance),
        balance: Number(account.balance),
      })),
      transactions.map((transaction) => ({
        ...transaction,
        amount: Number(transaction.amount),
      })),
      months,
    ),
  };
}
