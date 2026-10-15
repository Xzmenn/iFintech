import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";

export const GET = withApi(async () => {
  await requireUser();
  return new NextResponse(
    "tanggal,jenis,jumlah,akun,akun_tujuan,kategori,subkategori,catatan,tag\n",
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ifintech-template.csv"',
        "Cache-Control": "no-store",
      },
    },
  );
});
