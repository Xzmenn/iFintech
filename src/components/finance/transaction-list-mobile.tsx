"use client";

import { Paperclip, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useCurrencyFormatter } from "@/hooks/use-settings";
import type { FinanceTransaction } from "@/hooks/use-finance";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TransactionListMobile({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: FinanceTransaction[];
  onEdit: (transaction: FinanceTransaction) => void;
  onDelete: (id: string) => void;
}) {
  const formatCurrency = useCurrencyFormatter();
  return (
    <div className="space-y-3 md:hidden">
      {transactions.map((transaction) => (
        <Card key={transaction.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                {transaction.category && (
                  <CategoryIcon
                    name={transaction.category.icon}
                    color={transaction.category.color}
                    className="size-8 shrink-0 rounded-lg"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {transaction.category?.name || transaction.note || "Transaksi"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDate(transaction.date)} · {transaction.account.name}
                    {transaction.type === "TRANSFER" && ` → ${transaction.toAccount?.name || "—"}`}
                  </p>
                  {(transaction.subCategory || transaction.note) && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {transaction.subCategory?.name}
                      {transaction.subCategory && transaction.note && " · "}
                      {transaction.note}
                    </p>
                  )}
                </div>
              </div>
              <strong
                className={
                  transaction.type === "INCOME"
                    ? "shrink-0 text-emerald-600"
                    : transaction.type === "EXPENSE"
                      ? "shrink-0 text-red-600"
                      : "text-muted-foreground shrink-0"
                }
              >
                {transaction.type === "INCOME" ? "+" : transaction.type === "EXPENSE" ? "−" : ""}
                {formatCurrency(transaction.amount)}
              </strong>
            </div>
            {transaction.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {transaction.tags.map(({ tag }) => (
                  <Badge key={tag.id} variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => onEdit(transaction)}>
                <Pencil className="mr-1 size-3.5" />
                Ubah
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(transaction.id)}>
                <Trash2 className="mr-1 size-3.5" />
                Hapus
              </Button>
              {transaction.attachments.map((attachment) => (
                <Button key={attachment.id} variant="ghost" size="sm" asChild>
                  <a href={`/api/attachments/${attachment.id}`} aria-label={attachment.fileName}>
                    <Paperclip className="mr-1 size-3.5" />
                    Lampiran
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
