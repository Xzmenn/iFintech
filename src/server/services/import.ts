import { serialize } from "@/lib/serialize";
import type { ParsedImportRow } from "@/lib/import";
import { db, textEquals } from "@/server/db";
import { createTransaction } from "@/server/services/transaction";

const categoryType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  TRANSFER: "TRANSFER",
} as const;

export async function commitImportRows(userId: string, rows: ParsedImportRow[]) {
  const errors: { row: number; message: string }[] = [];
  let imported = 0;

  for (const row of rows) {
    try {
      let categoryId: string | null = null;
      let subCategoryId: string | null = null;
      if (row.categoryName) {
        let category = await db.category.findFirst({
          where: {
            userId,
            type: categoryType[row.type],
            name: textEquals(row.categoryName),
          },
        });
        if (!category) {
          category = await db.category.create({
            data: {
              userId,
              name: row.categoryName,
              type: categoryType[row.type],
              icon: "Wallet",
              color: "#64748b",
            },
          });
        }
        categoryId = category.id;
        if (row.subCategoryName) {
          let subCategory = await db.subCategory.findFirst({
            where: { categoryId, name: textEquals(row.subCategoryName) },
          });
          if (!subCategory) {
            subCategory = await db.subCategory.create({
              data: { categoryId, name: row.subCategoryName },
            });
          }
          subCategoryId = subCategory.id;
        }
      }
      await createTransaction(userId, {
        type: row.type,
        amount: row.amount,
        date: row.date,
        accountId: row.accountId,
        toAccountId: row.toAccountId,
        categoryId,
        subCategoryId,
        note: row.note,
        tags: row.tags,
      });
      imported += 1;
    } catch (error) {
      errors.push({
        row: row.row,
        message: error instanceof Error ? error.message : "Transaksi tidak dapat diimpor",
      });
    }
  }

  return serialize({ imported, failed: errors.length, errors });
}
