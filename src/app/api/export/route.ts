import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { db } from "@/server/db";

export const runtime = "nodejs";

const querySchema = z.object({
  format: z.enum(["csv", "xlsx", "pdf"]),
  scope: z.enum(["transactions", "report"]).default("transactions"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
});

function idrDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function transactionType(type: string) {
  if (type === "INCOME") return "pemasukan";
  if (type === "EXPENSE") return "pengeluaran";
  return "transfer";
}

const csvFields = [
  "tanggal",
  "jenis",
  "jumlah",
  "akun",
  "akun_tujuan",
  "kategori",
  "subkategori",
  "catatan",
  "tag",
] as const;

function csvRow(transaction: {
  date: Date;
  type: string;
  amount: unknown;
  account: { name: string };
  toAccount: { name: string } | null;
  category: { name: string } | null;
  subCategory: { name: string } | null;
  note: string | null;
  tags: { tag: { name: string } }[];
}) {
  return {
    tanggal: idrDate(transaction.date),
    jenis: transactionType(transaction.type),
    jumlah: Number(transaction.amount),
    akun: transaction.account.name,
    akun_tujuan: transaction.toAccount?.name || "",
    kategori: transaction.category?.name || "",
    subkategori: transaction.subCategory?.name || "",
    catatan: transaction.note || "",
    tag: transaction.tags.map((item) => item.tag.name).join("|"),
  };
}

export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const query = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const from = query.from;
  const to = query.to;
  if (from && to && from > to) {
    return NextResponse.json({ error: "Periode tidak valid" }, { status: 400 });
  }
  const transactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.accountId
        ? { OR: [{ accountId: query.accountId }, { toAccountId: query.accountId }] }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    },
    include: {
      account: { select: { name: true } },
      toAccount: { select: { name: true } },
      category: { select: { name: true } },
      subCategory: { select: { name: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const rows = transactions.map(csvRow);
  const suffix = from && to ? `${idrDate(from)}_${idrDate(to)}` : "semua";
  const prefix = query.scope === "transactions" ? "transaksi" : "laporan";
  const filename = `ifintech-${prefix}-${suffix}.${query.format}`;
  let body: Uint8Array | string;
  let contentType: string;

  if (query.format === "csv") {
    body = Papa.unparse({
      fields: [...csvFields],
      data: rows.map((row) => csvFields.map((field) => row[field])),
    });
    contentType = "text/csv; charset=utf-8";
  } else if (query.format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Transaksi");
    sheet.columns = [
      { header: "tanggal", key: "tanggal", width: 15 },
      { header: "jenis", key: "jenis", width: 18 },
      { header: "jumlah", key: "jumlah", width: 18, style: { numFmt: '"Rp" #,##0' } },
      { header: "akun", key: "akun", width: 24 },
      { header: "akun_tujuan", key: "akun_tujuan", width: 24 },
      { header: "kategori", key: "kategori", width: 22 },
      { header: "subkategori", key: "subkategori", width: 22 },
      { header: "catatan", key: "catatan", width: 36 },
      { header: "tag", key: "tag", width: 28 },
    ];
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
    const summary = workbook.addWorksheet("Ringkasan");
    const income = transactions.reduce(
      (sum, item) => sum + (item.type === "INCOME" ? Number(item.amount) : 0),
      0,
    );
    const expense = transactions.reduce(
      (sum, item) => sum + (item.type === "EXPENSE" ? Number(item.amount) : 0),
      0,
    );
    summary.addRows([
      ["Metrik", "Jumlah"],
      ["Pemasukan", income],
      ["Pengeluaran", expense],
      ["Arus kas bersih", income - expense],
      ["Jumlah transaksi", transactions.length],
    ]);
    summary.getRow(1).font = { bold: true };
    summary.getColumn(2).numFmt = '"Rp" #,##0';
    const categoryTotals = new Map<string, number>();
    for (const item of transactions) {
      if (!item.category) continue;
      categoryTotals.set(
        item.category.name,
        (categoryTotals.get(item.category.name) || 0) + Number(item.amount),
      );
    }
    const categories = workbook.addWorksheet("Kategori");
    categories.addRows([
      ["Kategori", "Jumlah"],
      ...Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]),
    ]);
    categories.getRow(1).font = { bold: true };
    categories.getColumn(2).numFmt = '"Rp" #,##0';
    body = new Uint8Array(await workbook.xlsx.writeBuffer());
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else {
    const pdf = new jsPDF();
    const period = from && to ? `${idrDate(from)} - ${idrDate(to)}` : "Semua periode";
    const income = transactions.reduce(
      (sum, item) => sum + (item.type === "INCOME" ? Number(item.amount) : 0),
      0,
    );
    const expense = transactions.reduce(
      (sum, item) => sum + (item.type === "EXPENSE" ? Number(item.amount) : 0),
      0,
    );
    pdf.setFontSize(18);
    pdf.text("Laporan Keuangan iFintech", 14, 18);
    pdf.setFontSize(10);
    pdf.text(`Periode: ${period}`, 14, 25);
    autoTable(pdf, {
      startY: 31,
      head: [["Ringkasan", "Jumlah"]],
      body: [
        ["Pemasukan", income.toLocaleString("id-ID")],
        ["Pengeluaran", expense.toLocaleString("id-ID")],
        ["Arus kas bersih", (income - expense).toLocaleString("id-ID")],
        ["Jumlah transaksi", String(transactions.length)],
      ],
    });
    const categoryTotals = new Map<string, number>();
    for (const item of transactions) {
      if (!item.category) continue;
      categoryTotals.set(
        item.category.name,
        (categoryTotals.get(item.category.name) || 0) + Number(item.amount),
      );
    }
    autoTable(pdf, {
      head: [["Kategori", "Jumlah"]],
      body: Array.from(categoryTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, amount]) => [name, amount.toLocaleString("id-ID")]),
      didDrawPage: () => undefined,
    });
    autoTable(pdf, {
      head: [["Tanggal", "Jenis", "Kategori", "Akun", "Jumlah"]],
      body: transactions.map((item) => [
        idrDate(item.date),
        transactionType(item.type),
        item.category?.name || "-",
        item.account.name,
        Number(item.amount).toLocaleString("id-ID"),
      ]),
    });
    body = new Uint8Array(pdf.output("arraybuffer"));
    contentType = "application/pdf";
  }

  let responseBody: string | ArrayBuffer = body as string;
  if (typeof body !== "string") {
    const buffer = new ArrayBuffer(body.byteLength);
    new Uint8Array(buffer).set(body);
    responseBody = buffer;
  }
  return new NextResponse(responseBody, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
