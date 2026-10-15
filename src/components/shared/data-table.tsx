"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DataTable<TData, TValue>({
  columns,
  data,
  page = 0,
  pageSize = 10,
  total,
  onPageChange,
  onSortingChange,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  onSortingChange?: (sorting: SortingState) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [localPagination, setLocalPagination] = useState<PaginationState>({
    pageIndex: page,
    pageSize,
  });
  const manual = onPageChange !== undefined;
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex: page, pageSize },
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      onSortingChange?.(next);
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(localPagination) : updater;
      setLocalPagination(next);
      onPageChange?.(next.pageIndex, next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manual ? undefined : getSortedRowModel(),
    getPaginationRowModel: manual ? undefined : getPaginationRowModel(),
    manualPagination: manual,
    manualSorting: manual && onSortingChange !== undefined,
    pageCount: total === undefined ? undefined : Math.ceil(total / pageSize),
  });
  const count = total ?? table.getFilteredRowModel().rows.length;
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <Button
                      variant="ghost"
                      className="-ml-3 h-8 px-3 font-medium"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? <ArrowUp className="ml-2 size-3.5" /> :
                        header.column.getIsSorted() === "desc" ? <ArrowDown className="ml-2 size-3.5" /> :
                          <ChevronsUpDown className="ml-2 size-3.5 text-muted-foreground" />}
                    </Button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Tidak ada data.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
        <span>{count.toLocaleString("id-ID")} data</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Sebelumnya</Button>
          <span>{page + 1} / {Math.max(1, table.getPageCount())}</span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Berikutnya</Button>
        </div>
      </div>
    </div>
  );
}
