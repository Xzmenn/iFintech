"use client";

import { createColumnHelper, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { Paperclip, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { FinanceTransaction } from "@/hooks/use-finance";
import { CategoryIcon } from "@/components/shared/category-icon";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const column = createColumnHelper<FinanceTransaction>();

export function TransactionTable({
  transactions,
  page,
  pageSize,
  total,
  onPageChange,
  onSortingChange,
  onEdit,
  onDelete,
}: {
  transactions: FinanceTransaction[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onSortingChange: (sorting: SortingState) => void;
  onEdit: (transaction: FinanceTransaction) => void;
  onDelete: (id: string) => void;
}) {
  const columns = [
    column.accessor("date", {
      header: "Tanggal",
      enableSorting: true,
      cell: (info) => formatDate(info.getValue()),
    }),
    column.display({
      id: "description",
      header: "Keterangan",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="min-w-48">
          <div className="flex items-center gap-2 font-medium">
            {row.original.category && (
              <CategoryIcon
                name={row.original.category.icon}
                color={row.original.category.color}
                className="size-7 rounded-lg"
              />
            )}
            <span>{row.original.category?.name || row.original.note || "Transaksi"}</span>
            {row.original.attachments.length > 0 && (
              <a
                href={`/api/attachments/${row.original.attachments[0].id}`}
                aria-label={`${row.original.attachments.length} lampiran`}
                title={`${row.original.attachments.length} lampiran`}
              >
                <Paperclip className="text-muted-foreground size-4" />
              </a>
            )}
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1 text-xs">
            {row.original.subCategory && <span>{row.original.subCategory.name}</span>}
            {row.original.subCategory && row.original.note && <span>·</span>}
            {row.original.note && <span>{row.original.note}</span>}
          </div>
          {row.original.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {row.original.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
    }),
    column.display({
      id: "account",
      header: "Akun",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.type === "TRANSFER"
          ? `${row.original.account.name} → ${row.original.toAccount?.name || "—"}`
          : row.original.account.name,
    }),
    column.accessor("amount", {
      header: "Jumlah",
      enableSorting: true,
      cell: ({ row }) => (
        <span
          className={
            row.original.type === "INCOME"
              ? "font-medium text-emerald-600"
              : row.original.type === "EXPENSE"
                ? "font-medium text-red-600"
                : "text-muted-foreground font-medium"
          }
        >
          {row.original.type === "INCOME" ? "+" : row.original.type === "EXPENSE" ? "−" : ""}
          {formatCurrency(row.original.amount)}
        </span>
      ),
    }),
    column.display({
      id: "actions",
      header: "Aksi",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ubah transaksi"
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Hapus transaksi"
            onClick={() => onDelete(row.original.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <DataTable
      columns={columns as unknown as ColumnDef<FinanceTransaction, unknown>[]}
      data={transactions}
      page={page - 1}
      pageSize={pageSize}
      total={total}
      onPageChange={(nextPage) => onPageChange(nextPage + 1)}
      onSortingChange={onSortingChange}
    />
  );
}
