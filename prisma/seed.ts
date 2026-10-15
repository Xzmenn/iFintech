import "dotenv/config";
import {
  AccountType,
  CategoryType,
  Prisma,
  RecurrenceFrequency,
  TransactionType,
} from "@prisma/client";
import { createUser } from "@/server/services/user";
import { recalculateBalances } from "@/server/services/balance";
import { db } from "@/server/db";

const demoEmail = "demo@ifintech.app";
const demoPassword = "Demo12345!";

async function main() {
  await db.user.deleteMany({ where: { email: demoEmail } });
  const user = await createUser({
    name: "Pengguna Demo",
    email: demoEmail,
    password: demoPassword,
  });

  const account = async (
    name: string,
    type: AccountType,
    initialBalance: number,
    color: string,
    icon: string,
    creditLimit?: number,
  ) =>
    db.account.create({
      data: {
        userId: user.id,
        name,
        type,
        initialBalance: new Prisma.Decimal(initialBalance),
        balance: new Prisma.Decimal(initialBalance),
        color,
        icon,
        ...(creditLimit ? { creditLimit: new Prisma.Decimal(creditLimit) } : {}),
      },
    });

  const cash = await account("Kas", AccountType.CASH, 500_000, "#22c55e", "wallet");
  const bank = await account("BCA", AccountType.BANK, 20_000_000, "#2563eb", "landmark");
  const wallet = await account("GoPay", AccountType.EWALLET, 500_000, "#06b6d4", "smartphone");
  const credit = await account(
    "Kartu Kredit BNI",
    AccountType.CREDIT_CARD,
    0,
    "#f97316",
    "credit-card",
    10_000_000,
  );
  const investment = await account(
    "Reksa Dana",
    AccountType.INVESTMENT,
    5_000_000,
    "#8b5cf6",
    "chart-pie",
  );

  const categories = await db.category.findMany({
    where: { userId: user.id },
    include: { subCategories: true },
  });
  const categoryId = (name: string, type: CategoryType) => {
    const found = categories.find((category) => category.name === name && category.type === type);
    if (!found) throw new Error(`Kategori tidak ditemukan: ${name}`);
    return found.id;
  };
  const salaryCategory = categoryId("Gaji", CategoryType.INCOME);
  const freelanceCategory = categoryId("Freelance", CategoryType.INCOME);
  const foodCategory = categoryId("Makan & Minum", CategoryType.EXPENSE);
  const transportCategory = categoryId("Transportasi", CategoryType.EXPENSE);
  const shoppingCategory = categoryId("Belanja", CategoryType.EXPENSE);
  const billsCategory = categoryId("Tagihan", CategoryType.EXPENSE);
  const transferCategory = categoryId("Transfer", CategoryType.TRANSFER);

  const tags = await Promise.all(
    [
      { name: "rutin", color: "#0ea5e9" },
      { name: "keluarga", color: "#8b5cf6" },
      { name: "kebutuhan", color: "#10b981" },
    ].map((tag) => db.tag.create({ data: { ...tag, userId: user.id } })),
  );
  const tagIds = new Map(tags.map((tag) => [tag.name, tag.id]));

  type Entry = {
    type: TransactionType;
    amount: number;
    date: Date;
    accountId: string;
    toAccountId?: string;
    categoryId: string;
    note: string;
    tags: string[];
  };
  const entries: Entry[] = [];
  const now = new Date();
  for (let offset = 2; offset >= 0; offset -= 1) {
    const year = now.getFullYear();
    const month = now.getMonth() - offset;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const latestDay = offset === 0 ? now.getDate() : lastDay;
    const date = (day: number) => {
      const candidate = new Date(year, month, Math.min(day, latestDay), 9);
      return candidate > now ? new Date(now) : candidate;
    };
    const currentMonthDay = offset === 0 ? 5 : 25;
    entries.push(
      {
        type: TransactionType.INCOME,
        amount: 12_500_000,
        date: date(currentMonthDay),
        accountId: bank.id,
        categoryId: salaryCategory,
        note: "Gaji bulanan",
        tags: ["rutin"],
      },
      {
        type: TransactionType.INCOME,
        amount: 1_200_000,
        date: date(10),
        accountId: bank.id,
        categoryId: freelanceCategory,
        note: "Proyek desain",
        tags: [],
      },
      {
        type: TransactionType.EXPENSE,
        amount: 180_000,
        date: date(7),
        accountId: wallet.id,
        categoryId: foodCategory,
        note: "Makan siang dan kopi",
        tags: ["kebutuhan"],
      },
      {
        type: TransactionType.EXPENSE,
        amount: 120_000,
        date: date(12),
        accountId: wallet.id,
        categoryId: transportCategory,
        note: "Transportasi harian",
        tags: ["rutin"],
      },
      {
        type: TransactionType.EXPENSE,
        amount: 800_000,
        date: date(14),
        accountId: bank.id,
        categoryId: billsCategory,
        note: "Tagihan listrik dan internet",
        tags: ["rutin"],
      },
      {
        type: TransactionType.EXPENSE,
        amount: 650_000,
        date: date(17),
        accountId: bank.id,
        categoryId: foodCategory,
        note: "Belanja kebutuhan rumah",
        tags: ["keluarga", "kebutuhan"],
      },
      {
        type: TransactionType.EXPENSE,
        amount: 1_200_000,
        date: date(19),
        accountId: credit.id,
        categoryId: shoppingCategory,
        note: "Belanja bulanan dengan kartu kredit",
        tags: ["keluarga"],
      },
      {
        type: TransactionType.TRANSFER,
        amount: 500_000,
        date: date(20),
        accountId: bank.id,
        toAccountId: wallet.id,
        categoryId: transferCategory,
        note: "Isi saldo GoPay",
        tags: [],
      },
      {
        type: TransactionType.TRANSFER,
        amount: 1_000_000,
        date: date(22),
        accountId: bank.id,
        toAccountId: investment.id,
        categoryId: transferCategory,
        note: "Top up investasi",
        tags: ["rutin"],
      },
    );
  }

  for (const entry of entries) {
    await db.transaction.create({
      data: {
        userId: user.id,
        type: entry.type,
        amount: new Prisma.Decimal(entry.amount),
        date: entry.date,
        accountId: entry.accountId,
        toAccountId: entry.toAccountId,
        categoryId: entry.categoryId,
        note: entry.note,
        tags: {
          create: entry.tags.map((name) => ({
            tag: { connect: { id: tagIds.get(name)! } },
          })),
        },
      },
    });
  }

  const currentMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  await db.budget.createMany({
    data: [
      {
        userId: user.id,
        categoryId: foodCategory,
        ...currentMonth,
        amount: new Prisma.Decimal(2_500_000),
        alertThreshold: 80,
      },
      {
        userId: user.id,
        categoryId: transportCategory,
        ...currentMonth,
        amount: new Prisma.Decimal(900_000),
        alertThreshold: 80,
      },
      {
        userId: user.id,
        categoryId: foodCategory,
        year: previousDate.getFullYear(),
        month: previousDate.getMonth() + 1,
        amount: new Prisma.Decimal(2_200_000),
        alertThreshold: 80,
      },
    ],
  });

  await db.goal.create({
    data: {
      userId: user.id,
      name: "Dana darurat",
      targetAmount: new Prisma.Decimal(30_000_000),
      deadline: new Date(now.getFullYear() + 1, now.getMonth(), 1),
      accountId: bank.id,
      color: "#14b887",
      icon: "shield-check",
      contributions: {
        create: [
          {
            amount: new Prisma.Decimal(2_000_000),
            date: new Date(now.getFullYear(), now.getMonth() - 2, 12),
            note: "Setoran awal",
          },
          {
            amount: new Prisma.Decimal(1_500_000),
            date: new Date(now.getFullYear(), now.getMonth() - 1, 12),
            note: "Setoran rutin",
          },
        ],
      },
    },
  });
  await db.goal.create({
    data: {
      userId: user.id,
      name: "Liburan keluarga",
      targetAmount: new Prisma.Decimal(12_000_000),
      deadline: new Date(now.getFullYear(), now.getMonth() + 6, 1),
      accountId: cash.id,
      color: "#f59e0b",
      icon: "plane",
      contributions: {
        create: [
          {
            amount: new Prisma.Decimal(750_000),
            date: new Date(now.getFullYear(), now.getMonth() - 1, 18),
            note: "Tabungan liburan",
          },
        ],
      },
    },
  });

  await db.recurringTransaction.createMany({
    data: [
      {
        userId: user.id,
        type: TransactionType.EXPENSE,
        amount: new Prisma.Decimal(120_000),
        accountId: wallet.id,
        categoryId: transportCategory,
        frequency: RecurrenceFrequency.WEEKLY,
        interval: 1,
        startDate: now,
        nextRunDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
        note: "Transportasi mingguan",
        tagNames: "rutin",
      },
      {
        userId: user.id,
        type: TransactionType.EXPENSE,
        amount: new Prisma.Decimal(800_000),
        accountId: bank.id,
        categoryId: billsCategory,
        frequency: RecurrenceFrequency.MONTHLY,
        interval: 1,
        startDate: now,
        nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
        note: "Tagihan internet bulanan",
        tagNames: "rutin",
      },
    ],
  });

  await db.$transaction((tx) =>
    recalculateBalances(tx, user.id, [cash.id, bank.id, wallet.id, credit.id, investment.id]),
  );

  console.info(`Seed selesai untuk ${demoEmail}`);
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
