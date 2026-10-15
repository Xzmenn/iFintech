"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useSettings, settingsQueryKey, type UserSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Profile = { id: string; name: string; email: string; image: string | null };
type ImportPreview = {
  total: number;
  valid?: number;
  imported?: number;
  failed: number;
  errors: { row: number; message: string }[];
};

export function SettingsManager() {
  const client = useQueryClient();
  const settings = useSettings();
  const { setTheme } = useTheme();
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiClient<Profile>("/api/profile"),
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [preferences, setPreferences] = useState<Partial<UserSettings>>({});
  const [importFile, setImportFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<unknown>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(avatar);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatar]);

  if (profileQuery.isLoading) return <LoadingState />;
  if (profileQuery.isError || !profileQuery.data)
    return <ErrorState onRetry={() => void profileQuery.refetch()} />;

  const profile = profileQuery.data;
  const profileName = name || profile.name;
  const profileEmail = email || profile.email;
  const selectedSettings = { ...settings, ...preferences };

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const updated = await apiClient<Profile>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      client.setQueryData(["profile"], updated);
      setName("");
      setEmail("");
      toast.success("Profil berhasil diperbarui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profil gagal diperbarui");
    }
  }

  async function uploadAvatar() {
    if (!avatar) return;
    const data = new FormData();
    data.set("file", avatar);
    try {
      const result = await apiClient<{ image: string }>("/api/profile/avatar", {
        method: "POST",
        body: data,
      });
      client.setQueryData(["profile"], { ...profile, image: result.image });
      setAvatar(null);
      toast.success("Foto profil berhasil diperbarui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Foto profil gagal diunggah");
    }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiClient("/api/profile/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Kata sandi berhasil diubah");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kata sandi gagal diubah");
    }
  }

  async function savePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const updated = await apiClient<UserSettings>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          currency: preferences.currency || settings.currency,
          locale: preferences.locale || settings.locale,
          theme: preferences.theme || settings.theme,
          weekStartsOn: preferences.weekStartsOn ?? settings.weekStartsOn,
          budgetAlertThreshold: preferences.budgetAlertThreshold ?? settings.budgetAlertThreshold,
        }),
      });
      client.setQueryData(settingsQueryKey, updated);
      setPreferences({});
      setTheme(updated.theme);
      toast.success("Preferensi berhasil disimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preferensi gagal disimpan");
    }
  }

  async function previewImport() {
    if (!importFile) return;
    const data = new FormData();
    data.set("file", importFile);
    try {
      const result = await apiClient<ImportPreview>("/api/import?dryRun=true", {
        method: "POST",
        body: data,
      });
      setPreview(result);
      toast.success(`Pratinjau selesai: ${result.valid || 0} baris valid`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File CSV tidak dapat dibaca");
    }
  }

  async function commitImport() {
    if (!importFile) return;
    const data = new FormData();
    data.set("file", importFile);
    try {
      const result = await apiClient<ImportPreview>("/api/import", {
        method: "POST",
        body: data,
      });
      setPreview(result);
      setImportFile(null);
      toast.success(`${result.imported || 0} transaksi berhasil diimpor`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impor gagal");
    }
  }

  async function loadBackupFile(file: File | null) {
    setBackupFile(file);
    setBackupData(null);
    if (!file) return;
    try {
      setBackupData(JSON.parse(await file.text()));
    } catch {
      setBackupFile(null);
      toast.error("File cadangan bukan JSON yang valid");
    }
  }

  async function restoreBackup() {
    if (restoreConfirmation !== "RESTORE" || backupData === null) return;
    try {
      await apiClient("/api/backup/restore", {
        method: "POST",
        body: JSON.stringify({ confirm: restoreConfirmation, backup: backupData }),
      });
      await Promise.all([client.invalidateQueries(), profileQuery.refetch()]);
      setRestoreOpen(false);
      setRestoreConfirmation("");
      toast.success("Cadangan berhasil dipulihkan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pemulihan cadangan gagal");
    }
  }

  return (
    <>
      <PageHeader title="Pengaturan" description="Kelola profil, preferensi, dan data iFintech." />
      <Tabs defaultValue="profile" className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="preferences">Preferensi</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="about">Tentang</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={saveProfile} className="grid gap-4 sm:max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Nama</Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(event) => setName(event.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileEmail}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-fit">
                  Simpan profil
                </Button>
              </form>
              <div className="space-y-3">
                <Label htmlFor="avatar">Foto profil (maks. 2 MB)</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar className="size-14">
                    <AvatarImage
                      src={avatarPreview || profile.image || undefined}
                      alt="Foto profil"
                    />
                    <AvatarFallback>{profile.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="max-w-sm"
                    onChange={(event) => setAvatar(event.target.files?.[0] || null)}
                  />
                  <Button type="button" variant="outline" disabled={!avatar} onClick={uploadAvatar}>
                    Unggah foto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ubah kata sandi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={updatePassword} className="grid gap-4 sm:max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Kata sandi saat ini</Label>
                  <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Kata sandi baru</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <Button type="submit" className="w-fit">
                  Ubah kata sandi
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferensi aplikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={savePreferences} className="grid gap-5 sm:max-w-xl">
                <div className="space-y-2">
                  <Label>Mata uang</Label>
                  <Select
                    value={selectedSettings.currency}
                    onValueChange={(currency) =>
                      setPreferences((current) => ({
                        ...current,
                        currency: currency as UserSettings["currency"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["IDR", "USD", "SGD", "EUR", "MYR"] as const).map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bahasa dan format</Label>
                  <Select
                    value={selectedSettings.locale}
                    onValueChange={(locale) =>
                      setPreferences((current) => ({
                        ...current,
                        locale: locale as UserSettings["locale"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id-ID">Indonesia</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Awal minggu</Label>
                  <Select
                    value={String(selectedSettings.weekStartsOn)}
                    onValueChange={(value) =>
                      setPreferences((current) => ({
                        ...current,
                        weekStartsOn: Number(value) as 0 | 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Senin</SelectItem>
                      <SelectItem value="0">Minggu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Peringatan anggaran (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min={1}
                    max={100}
                    value={selectedSettings.budgetAlertThreshold}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        budgetAlertThreshold: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={selectedSettings.theme}
                    onValueChange={(theme) =>
                      setPreferences((current) => ({
                        ...current,
                        theme: theme as UserSettings["theme"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Terang</SelectItem>
                      <SelectItem value="dark">Gelap</SelectItem>
                      <SelectItem value="system">Sesuai perangkat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-fit">
                  Simpan preferensi
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ekspor transaksi</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(["csv", "xlsx", "pdf"] as const).map((format) => (
                <Button key={format} asChild variant="outline">
                  <a href={`/api/export?format=${format}`}>
                    Unduh {format === "xlsx" ? "Excel" : format.toUpperCase()}
                  </a>
                </Button>
              ))}
              <Button asChild variant="outline">
                <a href="/api/backup">Unduh cadangan JSON</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/api/import/template">Unduh template CSV</a>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Impor CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Pratinjau tidak mengubah data. Baris valid akan divalidasi kembali saat disimpan.
              </p>
              <div className="flex flex-wrap gap-2">
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  className="max-w-sm"
                  onChange={(event) => {
                    setImportFile(event.target.files?.[0] || null);
                    setPreview(null);
                  }}
                />
                <Button variant="outline" disabled={!importFile} onClick={previewImport}>
                  Pratinjau
                </Button>
                <Button disabled={!importFile || !preview?.valid} onClick={commitImport}>
                  Impor baris valid
                </Button>
              </div>
              {preview && (
                <div className="space-y-2">
                  <Alert>
                    <AlertDescription>
                      {preview.total} baris · {preview.valid ?? preview.imported ?? 0} valid/diimpor
                      · {preview.failed} gagal
                    </AlertDescription>
                  </Alert>
                  {preview.errors.length > 0 && (
                    <ul className="text-destructive max-h-36 space-y-1 overflow-auto text-sm">
                      {preview.errors.map((error, index) => (
                        <li key={`${error.row}-${index}`}>
                          Baris {error.row}: {error.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cadangan dan pemulihan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-destructive text-sm">
                Pemulihan mengganti seluruh data keuangan akun ini. Unduh cadangan terbaru sebelum
                melanjutkan.
              </p>
              <div className="flex flex-wrap gap-2">
                <Input
                  type="file"
                  accept=".json,application/json"
                  className="max-w-sm"
                  onChange={(event) => void loadBackupFile(event.target.files?.[0] || null)}
                />
                <Button
                  variant="destructive"
                  disabled={!backupFile || backupData === null}
                  onClick={() => setRestoreOpen(true)}
                >
                  Pulihkan cadangan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Tentang iFintech</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>iFintech · versi 1.0.0</p>
              <p className="text-muted-foreground">
                Aplikasi keuangan pribadi untuk mengelola transaksi, anggaran, tabungan, dan
                laporan.
              </p>
              <p className="text-muted-foreground">
                Aplikasi dapat dipasang dari menu browser pada perangkat yang mendukung PWA.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pulihkan seluruh data?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Semua akun, transaksi, anggaran, dan target saat ini akan diganti. Ketik RESTORE untuk
            mengonfirmasi.
          </p>
          <Input
            value={restoreConfirmation}
            onChange={(event) => setRestoreConfirmation(event.target.value)}
            aria-label="Ketik RESTORE untuk mengonfirmasi"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={restoreConfirmation !== "RESTORE"}
              onClick={() => void restoreBackup()}
            >
              Pulihkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
