import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import { parseImportRows } from "@/lib/import";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { AppError } from "@/server/errors";
import { db } from "@/server/db";
import { commitImportRows } from "@/server/services/import";

export const runtime = "nodejs";

const requiredHeaders = [
  "tanggal",
  "jenis",
  "jumlah",
  "akun",
  "akun_tujuan",
  "kategori",
  "subkategori",
  "catatan",
  "tag",
];

export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) throw new AppError(400, "Pilih file CSV terlebih dahulu");
  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new AppError(400, "File harus berformat CSV");
  }
  if (file.size > 5 * 1024 * 1024) throw new AppError(413, "Ukuran CSV maksimal 5 MB");

  const parsed = Papa.parse<Record<string, string>>((await file.text()).replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });
  const headers = parsed.meta.fields || [];
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length) {
    throw new AppError(400, `Kolom CSV tidak lengkap: ${missing.join(", ")}`);
  }
  const accounts = await db.account.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  const result = parseImportRows(parsed.data, accounts);
  const parseErrors = parsed.errors.map((error) => ({
    row: (error.row || 0) + 2,
    message: error.message,
  }));
  const errors = [...parseErrors, ...result.errors];
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      total: parsed.data.length,
      valid: result.valid.length,
      failed: errors.length,
      rows: result.valid,
      errors,
    });
  }

  const imported = await commitImportRows(user.id, result.valid);
  const commitErrors = imported.errors || [];
  return NextResponse.json({
    dryRun: false,
    total: parsed.data.length,
    imported: imported.imported,
    failed: errors.length + imported.failed,
    errors: [...errors, ...commitErrors],
  });
});
