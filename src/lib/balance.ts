export type BalanceTransaction = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number | string | { toNumber: () => number };
  accountId: string;
  toAccountId?: string | null;
};

export function transactionEffects(transaction: BalanceTransaction) {
  const amount =
    typeof transaction.amount === "object"
      ? transaction.amount.toNumber()
      : Number(transaction.amount);

  if (transaction.type === "INCOME") {
    return [{ accountId: transaction.accountId, delta: amount }];
  }
  if (transaction.type === "EXPENSE") {
    return [{ accountId: transaction.accountId, delta: -amount }];
  }
  if (!transaction.toAccountId) return [{ accountId: transaction.accountId, delta: -amount }];
  return [
    { accountId: transaction.accountId, delta: -amount },
    { accountId: transaction.toAccountId, delta: amount },
  ];
}
