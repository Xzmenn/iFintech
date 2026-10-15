import { describe, expect, it } from "vitest";
import { parseImportRows } from "@/lib/import";

const accounts = [
  { id: "cash", name: "Kas" },
  { id: "bank", name: "BCA" },
];

describe("parseImportRows", () => {
  it("accepts ISO and Indonesian dates, types, and pipe-separated tags", () => {
    const result = parseImportRows(
      [
        {
          tanggal: "2026-10-01",
          jenis: "pengeluaran",
          jumlah: "12500",
          akun: "kas",
          kategori: "Makanan",
          tag: "makan|kantor",
        },
        {
          tanggal: "02/10/2026",
          jenis: "pemasukan",
          jumlah: "500000",
          akun: "BCA",
          kategori: "Gaji",
          tag: "",
        },
      ],
      accounts,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]).toMatchObject({
      type: "EXPENSE",
      accountId: "cash",
      tags: ["makan", "kantor"],
    });
    expect(result.valid[1]).toMatchObject({ type: "INCOME", date: new Date(2026, 9, 2) });
  });

  it("reports invalid amounts and unknown accounts by row", () => {
    const result = parseImportRows(
      [
        {
          tanggal: "2026-10-01",
          jenis: "pengeluaran",
          jumlah: "bukan angka",
          akun: "Kas",
          kategori: "Makanan",
        },
        {
          tanggal: "2026-10-02",
          jenis: "pemasukan",
          jumlah: "100",
          akun: "Akun lain",
          kategori: "Gaji",
        },
      ],
      accounts,
    );
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toEqual([
      { row: 2, message: "Jumlah harus berupa angka" },
      { row: 3, message: 'Akun "Akun lain" tidak ditemukan' },
    ]);
  });

  it("validates transfer destinations", () => {
    const result = parseImportRows(
      [
        {
          tanggal: "2026-10-01",
          jenis: "transfer",
          jumlah: "10",
          akun: "Kas",
          akun_tujuan: "BCA",
        },
      ],
      accounts,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid[0]).toMatchObject({
      type: "TRANSFER",
      accountId: "cash",
      toAccountId: "bank",
    });
  });
});
