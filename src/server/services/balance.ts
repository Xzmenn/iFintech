import type { Prisma } from "@prisma/client";
import { transactionEffects } from "@/lib/balance";
import { AppError } from "@/server/errors";

export async function recalculateBalances(
  tx: Prisma.TransactionClient,
  userId: string,
  accountIds: string[],
) {
  const ids = [...new Set(accountIds)];
  if (ids.length === 0) return;
  const accounts = await tx.account.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true, name: true, type: true, initialBalance: true, creditLimit: true },
  });
  if (accounts.length !== ids.length) throw new AppError(404, "Akun tidak ditemukan");
  const transactions = await tx.transaction.findMany({
    where: {
      userId,
      OR: [{ accountId: { in: ids } }, { toAccountId: { in: ids } }],
    },
    select: { type: true, amount: true, accountId: true, toAccountId: true },
  });
  const balances = new Map(accounts.map((account) => [account.id, Number(account.initialBalance)]));
  for (const transaction of transactions) {
    for (const effect of transactionEffects(transaction)) {
      if (balances.has(effect.accountId)) {
        balances.set(effect.accountId, (balances.get(effect.accountId) || 0) + effect.delta);
      }
    }
  }

  for (const account of accounts) {
    const balance = balances.get(account.id) || 0;
    const minimum =
      account.type === "CREDIT_CARD" && account.creditLimit
        ? -Number(account.creditLimit)
        : 0;
    if (balance < minimum) {
      throw new AppError(422, `Saldo akun "${account.name}" tidak mencukupi`, "INSUFFICIENT_BALANCE");
    }
    await tx.account.update({
      where: { id: account.id },
      data: { balance },
    });
  }
}
