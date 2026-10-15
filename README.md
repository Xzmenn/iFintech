# iFintech

iFintech adalah aplikasi web keuangan pribadi dengan antarmuka berbahasa Indonesia dan mata uang
awal Rupiah (IDR). Aplikasi mendukung pencatatan transaksi, pemantauan saldo, anggaran, target
tabungan, laporan, impor/ekspor, serta cadangan data.

## Fitur

- Autentikasi email dan kata sandi, pendaftaran, reset kata sandi, serta pengelolaan profil.
- Dashboard, akun dan kategori, transaksi dengan lampiran/tag, transfer, dan transaksi berulang.
- Anggaran bulanan dengan status pemakaian dan target tabungan dengan kontribusi.
- Laporan arus kas, kategori, tren, dan kekayaan bersih; ekspor CSV, Excel, dan PDF.
- Impor CSV dengan pratinjau, unduh template, pencadangan JSON, dan pemulihan data.
- Preferensi mata uang, format lokal, awal minggu, batas peringatan anggaran, dan tema.
- PWA untuk perangkat dan browser yang mendukung pemasangan aplikasi.

## Teknologi

Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma 6, PostgreSQL 16,
NextAuth v4, React Hook Form, Zod, TanStack Query/Table, Recharts, date-fns, PapaParse, ExcelJS,
jsPDF, dan Vitest.

## Arsitektur dan struktur

```text
prisma/
  schema.prisma             Skema utama
  migrations/               Migrasi basis data
  seed.ts                   Data demo yang idempoten
src/
  app/
    (auth)/                  Halaman masuk, daftar, dan reset kata sandi
    (app)/                   Dashboard dan modul keuangan
    api/                     Route handler API
  components/
    finance/                 Tampilan tiap fitur
    layout/                  Sidebar, navigasi seluler, topbar
    shared/                  Komponen bersama
    ui/                      Komponen shadcn/ui
  hooks/                     Hook React Query dan preferensi
  lib/                       Utilitas, agregasi murni, format, validasi
  server/
    services/                Logika bisnis berbasis userId
    auth.ts                  Autentikasi dan otorisasi
    db.ts                    Prisma singleton dan helper pencarian
    storage.ts               Driver penyimpanan lokal
```

Semua layanan data membatasi query berdasarkan `userId`; pemeriksaan relasi dilakukan sebelum
menulis transaksi. API menggunakan `withApi` untuk mengubah error validasi dan error bisnis menjadi
respons JSON berbahasa Indonesia.

### Ringkasan ERD

- `User` memiliki satu `Setting`, banyak `Account`, `Category`, `Transaction`, `Tag`, `Budget`,
  `Goal`, dan `RecurringTransaction`.
- `Category` memiliki banyak `SubCategory`; transaksi dapat menghubungkan kategori dan subkategori.
- `Transaction` menghubungkan akun asal dan, untuk transfer, akun tujuan; relasi tag disimpan melalui
  `TransactionTag`. `Attachment` dimiliki pengguna dan transaksi.
- `Budget` menghubungkan kategori pengeluaran dengan tahun dan bulan.
- `Goal` dapat terhubung ke akun dan memiliki banyak `GoalContribution`.
- `RecurringTransaction` menyimpan aturan jadwal dan referensi transaksi yang dihasilkan.

Saldo akun dihitung dari saldo awal dan efek transaksi. Transfer mengurangi akun asal serta menambah
akun tujuan. Saldo kartu kredit negatif berarti utang; kekayaan bersih adalah jumlah saldo semua akun,
termasuk akun yang diarsipkan.

## Prasyarat

- Node.js 24 (Node.js 22 digunakan pada CI) dan npm.
- Docker dan Docker Compose untuk PostgreSQL 16, atau PostgreSQL yang dikelola sendiri.
- Git.

## Menjalankan secara lokal

```bash
source ~/.nvm/nvm.sh             # jika Node dikelola dengan nvm
docker compose up -d
cp .env.example .env
# Sesuaikan DATABASE_URL dan buat NEXTAUTH_SECRET/CRON_SECRET yang acak.
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Buka <http://localhost:3000>. Akun demo setelah seeding:

| Email               | Kata sandi   |
| ------------------- | ------------ |
| `demo@ifintech.app` | `Demo12345!` |

Jangan gunakan kredensial demo untuk data pribadi atau lingkungan produksi. `npm run db:seed`
menghapus lalu membuat ulang data demo sehingga aman diulang, tetapi perubahan data demo akan hilang.

## Perintah npm

| Perintah                                  | Fungsi                                      |
| ----------------------------------------- | ------------------------------------------- |
| `npm run dev`                             | Server pengembangan                         |
| `npm run build` / `npm run start`         | Build produksi / menjalankan hasil build    |
| `npm run lint`                            | ESLint                                      |
| `npm run format` / `npm run format:check` | Format repo / periksa format                |
| `npm run typecheck`                       | TypeScript tanpa emit                       |
| `npm test`                                | Menjalankan unit test Vitest                |
| `npx prisma generate`                     | Membuat Prisma Client                       |
| `npx prisma migrate dev`                  | Membuat dan menerapkan migrasi lokal        |
| `npm run db:deploy`                       | Menerapkan migrasi pada deployment          |
| `npm run db:seed`                         | Membuat data demo                           |
| `npm run db:reset`                        | Reset database dan migrasi (menghapus data) |
| `npm run db:studio`                       | Membuka Prisma Studio                       |

## Variabel lingkungan

Salin `.env.example` ke `.env`. Jangan commit file `.env` atau rahasia deployment.

| Variabel                                           | Keterangan                                                           |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                                     | URL PostgreSQL Prisma                                                |
| `NEXTAUTH_URL`                                     | URL aplikasi untuk NextAuth                                          |
| `NEXTAUTH_SECRET`                                  | Rahasia tanda tangan sesi JWT                                        |
| `APP_URL`                                          | URL publik untuk tautan aplikasi dan email                           |
| `TZ`                                               | Zona waktu server; gunakan `Asia/Jakarta` untuk batas bulan keuangan |
| `STORAGE_DIR`                                      | Direktori lokal untuk avatar dan lampiran                            |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Kredensial SMTP opsional                                             |
| `SMTP_FROM`                                        | Pengirim email reset kata sandi                                      |
| `CRON_SECRET`                                      | Bearer secret untuk route cron transaksi berulang                    |
| `LOG_LEVEL`                                        | Ambang log: `debug`, `info`, `warn`, atau `error`                    |

Jika SMTP belum diatur, tautan reset kata sandi dicatat oleh logger untuk pengembangan. Jangan
menonaktifkan atau membagikan log tersebut di lingkungan publik.

## PostgreSQL dan SQLite

PostgreSQL 16 adalah konfigurasi utama dan digunakan untuk migrasi produksi. Untuk demo SQLite lokal,
ubah sementara `datasource db` pada `prisma/schema.prisma` menjadi `provider = "sqlite"` dan set
`DATABASE_URL="file:./dev.db"`, lalu jalankan `npx prisma generate` dan migrasikan basis data.
Gunakan database dan riwayat migrasi terpisah; jangan menerapkan migrasi PostgreSQL yang sudah ada ke
SQLite. Helper pencarian aplikasi memilih filter teks yang sesuai dengan provider. Kembalikan provider
ke PostgreSQL sebelum deployment.

## Transaksi berulang terjadwal

Untuk memproses semua pengguna secara berkala, panggil endpoint cron dengan `CRON_SECRET` yang sama
dengan konfigurasi aplikasi:

```bash
curl -X POST "$APP_URL/api/cron/recurring" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Contoh Vercel Cron (atur `CRON_SECRET` sebagai environment variable dan tambahkan autentikasi bearer
melalui job scheduler yang digunakan):

```json
{
  "crons": [{ "path": "/api/cron/recurring", "schedule": "0 1 * * *" }]
}
```

Jadwal di atas berjalan setiap hari pukul 01:00 UTC. Endpoint menolak permintaan tanpa bearer token
yang valid. Kegagalan validasi saldo menghentikan aturan terkait tanpa memajukan jadwal berikutnya.

## Deployment

Gunakan Vercel atau platform Node.js yang mendukung Next.js App Router dan PostgreSQL terkelola.
Konfigurasikan seluruh variabel lingkungan, jalankan `npx prisma migrate deploy`, lalu build dan
jalankan aplikasi. `STORAGE_DIR` pada driver bawaan adalah disk lokal: untuk beberapa instance atau
deployment serverless, gunakan persistent volume atau implementasikan driver S3 yang memenuhi
`StorageDriver`. Backup JSON mencadangkan metadata dan data aplikasi; file lampiran memerlukan
penyimpanan file yang tetap tersedia.

## Impor CSV

Header harus persis berurutan seperti berikut:

```csv
tanggal,jenis,jumlah,akun,akun_tujuan,kategori,subkategori,catatan,tag
```

`jenis` menerima `pemasukan`, `pengeluaran`, atau `transfer`; tanggal dapat berupa `YYYY-MM-DD` atau
`DD/MM/YYYY`. Tag dipisahkan dengan `|`. Nama akun dicocokkan tanpa membedakan huruf besar/kecil.
Akun yang tidak ditemukan menghasilkan kesalahan baris. Kategori dan subkategori yang belum ada akan
dibuat ketika impor disimpan. Gunakan menu **Pengaturan → Data** untuk pratinjau, mengimpor baris
valid, atau mengunduh template.

## Route API utama

Semua route di bawah membutuhkan sesi autentikasi kecuali route autentikasi dan cron.

| Route                                                                            | Operasi                                                     |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `/api/auth/*`                                                                    | Sesi NextAuth, pendaftaran, lupa dan reset kata sandi       |
| `/api/profile`, `/api/profile/avatar`, `/api/profile/password`                   | Profil, avatar, kata sandi                                  |
| `/api/settings`                                                                  | Baca dan ubah preferensi                                    |
| `/api/accounts`, `/api/accounts/[id]`                                            | Daftar, buat, ubah, hapus, arsip akun                       |
| `/api/categories`, `/api/categories/[id]`, `/api/subcategories/[id]`             | Kategori dan subkategori                                    |
| `/api/transactions`, `/api/transactions/[id]`                                    | Transaksi, filter, pagination, dan CRUD                     |
| `/api/transactions/[id]/attachments`, `/api/attachments/[id]`                    | Unggah, unduh, hapus lampiran                               |
| `/api/tags`                                                                      | Daftar tag                                                  |
| `/api/recurring`, `/api/recurring/[id]`, `/api/recurring/run`                    | Aturan transaksi berulang                                   |
| `/api/cron/recurring`                                                            | Pemrosesan terjadwal dengan bearer secret                   |
| `/api/budgets`, `/api/budgets/[id]`, `/api/budgets/copy`, `/api/budgets/history` | Anggaran                                                    |
| `/api/goals`, `/api/goals/[id]`, `/api/goals/[id]/contributions`                 | Target dan kontribusi                                       |
| `/api/reports/summary`, `/category`, `/cashflow`, `/networth`                    | Agregasi laporan                                            |
| `/api/export`                                                                    | CSV, Excel, PDF, atau backup JSON (`format=json&scope=all`) |
| `/api/import`, `/api/import/template`                                            | Impor/pratinjau CSV dan template                            |
| `/api/backup`, `/api/backup/restore`                                             | Unduh dan pulihkan backup JSON                              |

## Asumsi

- Kontribusi target adalah pencatatan alokasi, bukan transfer atau perubahan saldo akun.
- Validasi saldo dilakukan terhadap saldo berjalan hasil rekalkulasi transaksi.
- Saldo kartu kredit negatif adalah utang; akun arsip tetap diperhitungkan dalam kekayaan bersih.
- Batas bulan mengikuti zona waktu server `Asia/Jakarta`.
- Transfer menggunakan kategori `Transfer` milik pengguna jika kategori tidak dikirim.
- Kegagalan pemrosesan transaksi berulang menghentikan aturan tanpa memajukan jadwalnya.
- Jika SMTP tidak tersedia, tautan reset kata sandi dicatat ke log dan tidak dikirim melalui email.
- Pemulihan backup mengganti seluruh data keuangan pengguna dan membuat ID baru.

## Kriteria penerimaan

- [x] **1. Fondasi:** Next.js, Prisma, validasi, autentikasi, dan API handler.
- [x] **2. Shell/PWA:** navigasi responsif, tema, halaman error, manifest, dan service worker.
- [x] **3. Akun/kategori:** CRUD dengan kepemilikan, arsip, subkategori, dan saldo.
- [x] **4. Transaksi:** validasi saldo, transfer, tag, lampiran, filter, dan aturan berulang.
- [x] **5. Anggaran:** status pemakaian, peringatan, salin bulan, dan riwayat.
- [x] **6. Target:** estimasi penyelesaian, kontribusi, dan status tenggat.
- [x] **7. Laporan:** dashboard, arus kas, kategori, kekayaan bersih, serta ekspor.
- [x] **8. Data/pengaturan:** impor, backup/restore, profil, avatar, kata sandi, preferensi.
- [x] **9. Kualitas:** test utilitas, lint, format, typecheck, build, dan workflow CI.

## Cara testing

Unit test:

```bash
npm test
npm run lint
npm run format:check
npm run typecheck
npm run build
```

Skenario manual yang disarankan setelah `npm run db:seed`:

1. Masuk dengan akun demo; periksa dashboard, akun, kategori, anggaran, target, dan laporan.
2. Buat pengeluaran yang melebihi saldo akun kas dan pastikan server menolak transaksi; buat
   pengeluaran valid dan periksa saldo.
3. Transfer antar akun dan pastikan kedua saldo berubah; ubah lalu hapus transaksi untuk menguji
   rekalkulasi.
4. Unggah lalu unduh lampiran. Buat aturan berulang dan jalankan pemrosesan.
5. Buat anggaran, tambahkan transaksi pada kategori tersebut, lalu periksa status dan peringatan.
6. Tambahkan kontribusi target dan periksa estimasi tanggal serta progres.
7. Ekspor transaksi sebagai CSV, Excel, dan PDF; pastikan CSV dapat dipratinjau kembali sebagai impor.
8. Unduh backup JSON, ubah data, pulihkan backup dengan mengetik `RESTORE`, lalu pastikan data dan
   saldo kembali sesuai.
9. Ubah profil, preferensi mata uang/tema, dan kata sandi; masuk kembali untuk memastikan perubahan
   tersimpan.

Migrasi, seed, dan verifikasi API produksi perlu dilakukan terhadap database non-produksi atau
database demo yang datanya boleh dihapus.
