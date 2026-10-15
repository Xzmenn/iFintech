import { z } from "zod";

const importRowSchema = z.object({
  tanggal: z.string().trim().min(1),
  jenis: z.string().trim().min(1),
  jumlah: z
    .union([z.string().trim(), z.number()])
    .transform((value) => (typeof value === "string" ? Number(value.replace(",", ".")) : value))
    .refine(Number.isFinite, "Jumlah harus berupa angka")
    .refine((value) => value > 0, "Jumlah harus lebih besar dari nol"),
  akun: z.string().trim().min(1),
  akun_tujuan: z.string().trim().optional().default(""),
  kategori: z.string().trim().optional().default(""),
  subkategori: z.string().trim().optional().default(""),
  catatan: z.string().trim().optional().default(""),
  tag: z.string().trim().optional().default(""),
});

const transactionTypes: Record<string, "INCOME" | "EXPENSE" | "TRANSFER"> = {
  pemasukan: "INCOME",
  income: "INCOME",
  pengeluaran: "EXPENSE",
  expense: "EXPENSE",
  transfer: "TRANSFER",
};

function parseImportDate(value: string) {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const local = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const match = iso || local;
  if (!match) return null;
  const year = Number(iso ? match[1] : match[3]);
  const month = Number(match[2]);
  const day = Number(iso ? match[3] : match[1]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export type ImportAccount = { id: string; name: string };
export type ParsedImportRow = {
  row: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: Date;
  accountId: string;
  toAccountId: string | null;
  categoryName: string;
  subCategoryName: string;
  note: string;
  tags: string[];
};

export function parseImportRows(rows: Record<string, unknown>[], accounts: ImportAccount[]) {
  const accountMap = new Map(
    accounts.map((account) => [account.name.trim().toLowerCase(), account]),
  );
  const valid: ParsedImportRow[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((source, index) => {
    const rowNumber = index + 2;
    const result = importRowSchema.safeParse(source);
    if (!result.success) {
      errors.push({
        row: rowNumber,
        message: result.error.issues[0]?.message || "Baris tidak valid",
      });
      return;
    }
    const values = result.data;
    const type = transactionTypes[values.jenis.toLowerCase()];
    if (!type) {
      errors.push({ row: rowNumber, message: "Jenis harus pemasukan, pengeluaran, atau transfer" });
      return;
    }
    const date = parseImportDate(values.tanggal);
    if (!date) {
      errors.push({ row: rowNumber, message: "Tanggal harus YYYY-MM-DD atau DD/MM/YYYY" });
      return;
    }
    const account = accountMap.get(values.akun.toLowerCase());
    if (!account) {
      errors.push({ row: rowNumber, message: `Akun "${values.akun}" tidak ditemukan` });
      return;
    }
    const destination =
      type === "TRANSFER" ? accountMap.get(values.akun_tujuan.toLowerCase()) : undefined;
    if (type === "TRANSFER" && !destination) {
      errors.push({
        row: rowNumber,
        message: `Akun tujuan "${values.akun_tujuan}" tidak ditemukan`,
      });
      return;
    }
    if (type === "TRANSFER" && destination?.id === account.id) {
      errors.push({ row: rowNumber, message: "Akun tujuan transfer harus berbeda dari akun asal" });
      return;
    }
    if (type !== "TRANSFER" && !values.kategori) {
      errors.push({ row: rowNumber, message: "Kategori wajib diisi" });
      return;
    }
    valid.push({
      row: rowNumber,
      type,
      amount: values.jumlah,
      date,
      accountId: account.id,
      toAccountId: destination?.id || null,
      categoryName: values.kategori,
      subCategoryName: values.subkategori,
      note: values.catatan,
      tags: values.tag
        .split("|")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  });

  return { valid, errors };
}
