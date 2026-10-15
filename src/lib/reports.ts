import { transactionEffects } from "@/lib/balance";

export type CashflowTransaction = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: Date | string;
};

export type CashflowPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  runningNet: number;
};

type Bucket = "day" | "week" | "month";

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = startOfDay(date);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function bucketStart(date: Date, bucket: Bucket) {
  if (bucket === "day") return startOfDay(date);
  if (bucket === "week") return startOfWeek(date);
  return startOfMonth(date);
}

function bucketKey(date: Date, bucket: Bucket) {
  const start = bucketStart(date, bucket);
  return bucket === "month" ? dateKey(start).slice(0, 7) : dateKey(start);
}

function bucketLabel(date: Date, bucket: Bucket) {
  return new Intl.DateTimeFormat("id-ID", {
    day: bucket === "month" ? undefined : "numeric",
    month: "short",
    year: bucket === "month" ? "numeric" : undefined,
  }).format(date);
}

export function bucketCashflow(
  transactions: CashflowTransaction[],
  from: Date | string,
  to: Date | string,
) {
  const start = startOfDay(asDate(from));
  const end = startOfDay(asDate(to));
  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (dayCount <= 0) return { bucket: "day" as const, items: [] as CashflowPoint[] };

  const bucket: Bucket = dayCount <= 31 ? "day" : dayCount <= 180 ? "week" : "month";
  const starts: Date[] = [];
  let cursor = bucketStart(start, bucket);
  while (cursor <= end) {
    starts.push(cursor);
    cursor = new Date(cursor);
    if (bucket === "day") cursor.setDate(cursor.getDate() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  const grouped = new Map(
    starts.map((date) => [bucketKey(date, bucket), { income: 0, expense: 0 }]),
  );
  for (const transaction of transactions) {
    const date = asDate(transaction.date);
    if (date < start || date >= new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)) {
      continue;
    }
    if (transaction.type === "TRANSFER") continue;
    const key = bucketKey(date, bucket);
    const value = grouped.get(key);
    if (!value) continue;
    if (transaction.type === "INCOME") value.income += transaction.amount;
    else value.expense += transaction.amount;
  }

  let runningNet = 0;
  const items = starts.map((date) => {
    const key = bucketKey(date, bucket);
    const value = grouped.get(key) || { income: 0, expense: 0 };
    const net = value.income - value.expense;
    runningNet += net;
    return {
      key,
      label: bucketLabel(date, bucket),
      income: value.income,
      expense: value.expense,
      net,
      runningNet,
    };
  });
  return { bucket, items };
}

export type NetWorthAccount = {
  id: string;
  initialBalance: number;
  balance?: number;
};

export type NetWorthTransaction = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: Date | string;
  accountId: string;
  toAccountId?: string | null;
};

export type NetWorthPoint = {
  month: string;
  label: string;
  assets: number;
  liabilities: number;
  netWorth: number;
};

export function reconstructNetWorth(
  accounts: NetWorthAccount[],
  transactions: NetWorthTransaction[],
  months = 12,
  now = new Date(),
): NetWorthPoint[] {
  const count = Math.max(1, Math.min(60, Math.floor(months)));
  const orderedTransactions = [...transactions].sort(
    (left, right) => asDate(left.date).getTime() - asDate(right.date).getTime(),
  );
  const balances = new Map(accounts.map((account) => [account.id, account.initialBalance]));
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - count + 1, 1);
  let transactionIndex = 0;
  const points: NetWorthPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    const monthDate = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
    const cutoff = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
    while (
      transactionIndex < orderedTransactions.length &&
      asDate(orderedTransactions[transactionIndex].date) <= cutoff
    ) {
      const transaction = orderedTransactions[transactionIndex];
      for (const effect of transactionEffects(transaction)) {
        if (balances.has(effect.accountId)) {
          balances.set(effect.accountId, (balances.get(effect.accountId) || 0) + effect.delta);
        }
      }
      transactionIndex += 1;
    }

    const snapshot =
      index === count - 1 && accounts.every((account) => account.balance !== undefined)
        ? new Map(accounts.map((account) => [account.id, account.balance as number]))
        : balances;
    const values = Array.from(snapshot.values());
    const assets = values.reduce((sum, value) => sum + Math.max(0, value), 0);
    const liabilities = values.reduce((sum, value) => sum + Math.abs(Math.min(0, value)), 0);
    points.push({
      month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(
        monthDate,
      ),
      assets,
      liabilities,
      netWorth: assets - liabilities,
    });
  }
  return points;
}
