export type BudgetStatus = "aman" | "peringatan" | "melebihi";

export function getBudgetStatus(spent: number, amount: number, threshold: number) {
  const percent = amount > 0 ? Math.round((spent / amount) * 100) : 0;
  const remaining = amount - spent;
  const status: BudgetStatus =
    percent >= 100 ? "melebihi" : percent >= threshold ? "peringatan" : "aman";
  return { percent, remaining, status };
}
