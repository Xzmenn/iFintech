import { Prisma } from "@prisma/client";
import { serialize } from "@/lib/serialize";
import { AppError, notFound } from "@/server/errors";
import { db } from "@/server/db";
import { recalculateBalances } from "@/server/services/balance";

export async function listAccounts(userId: string, includeArchived = false) {
  const accounts = await db.account.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return {
    items: serialize(accounts),
    netWorth: accounts.reduce((sum, account) => sum + Number(account.balance), 0),
  };
}

export async function getAccount(userId: string, id: string) {
  const account = await db.account.findFirst({ where: { id, userId } });
  if (!account) throw notFound("Akun tidak ditemukan");
  return serialize(account);
}

export async function createAccount(userId: string, input: {
  name: string; type: "CASH" | "BANK" | "EWALLET" | "CREDIT_CARD" | "INVESTMENT";
  initialBalance: number; creditLimit?: number | null; color?: string; icon?: string; note?: string | null;
}) {
  if (input.type !== "CREDIT_CARD" && (input.initialBalance < 0 || input.creditLimit)) {
    throw new AppError(400, "Saldo awal negatif dan batas kredit hanya berlaku untuk kartu kredit");
  }
  if (input.type === "CREDIT_CARD" && !input.creditLimit) {
    throw new AppError(400, "Batas kredit wajib diisi untuk kartu kredit");
  }
  return db.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        userId, name: input.name, type: input.type,
        initialBalance: new Prisma.Decimal(input.initialBalance),
        balance: new Prisma.Decimal(input.initialBalance),
        creditLimit: input.type === "CREDIT_CARD" && input.creditLimit
          ? new Prisma.Decimal(input.creditLimit) : null,
        color: input.color, icon: input.icon, note: input.note,
      },
    });
    await recalculateBalances(tx, userId, [account.id]);
    return serialize(await tx.account.findUniqueOrThrow({ where: { id: account.id } }));
  });
}

export async function updateAccount(userId: string, id: string, input: {
  name?: string; type?: "CASH" | "BANK" | "EWALLET" | "CREDIT_CARD" | "INVESTMENT";
  initialBalance?: number; creditLimit?: number | null; color?: string; icon?: string; note?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const current = await tx.account.findFirst({ where: { id, userId } });
    if (!current) throw notFound("Akun tidak ditemukan");
    const type = input.type ?? current.type;
    const creditLimit = input.creditLimit === undefined ? current.creditLimit : input.creditLimit;
    const initialBalance = input.initialBalance ?? Number(current.initialBalance);
    if (type !== "CREDIT_CARD" && (initialBalance < 0 || creditLimit)) {
      throw new AppError(400, "Saldo awal negatif dan batas kredit hanya berlaku untuk kartu kredit");
    }
    if (type === "CREDIT_CARD" && !creditLimit) {
      throw new AppError(400, "Batas kredit wajib diisi untuk kartu kredit");
    }
    await tx.account.update({
      where: { id },
      data: {
        ...input,
        initialBalance: new Prisma.Decimal(initialBalance),
        creditLimit: creditLimit === null ? null : creditLimit === undefined ? current.creditLimit : new Prisma.Decimal(creditLimit),
      },
    });
    await recalculateBalances(tx, userId, [id]);
    return serialize(await tx.account.findUniqueOrThrow({ where: { id } }));
  });
}

export async function setAccountArchived(userId: string, id: string, archived: boolean) {
  const result = await db.account.updateMany({ where: { id, userId }, data: { isArchived: archived } });
  if (!result.count) throw notFound("Akun tidak ditemukan");
  return getAccount(userId, id);
}

export async function deleteAccount(userId: string, id: string) {
  return db.$transaction(async (tx) => {
    const account = await tx.account.findFirst({ where: { id, userId } });
    if (!account) throw notFound("Akun tidak ditemukan");
    const count = await tx.transaction.count({
      where: { userId, OR: [{ accountId: id }, { toAccountId: id }] },
    });
    if (count) throw new AppError(409, "Akun memiliki transaksi, arsipkan saja");
    await tx.account.delete({ where: { id } });
    return { id };
  });
}
