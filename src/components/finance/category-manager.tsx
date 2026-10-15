"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useCategories, type Category } from "@/hooks/use-finance";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "@/components/shared/color-picker";
import { IconPicker } from "@/components/shared/icon-picker";
import { CategoryIcon } from "@/components/shared/category-icon";

const types = [
  ["EXPENSE", "Pengeluaran"], ["INCOME", "Pemasukan"], ["TRANSFER", "Transfer"],
] as const;

export function CategoryManager() {
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const query = useCategories(type);
  const client = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("circle");
  const [color, setColor] = useState("#64748b");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiClient(editing ? `/api/categories/${editing.id}` : "/api/categories", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({ name, type, icon, color }),
      });
      await client.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false); toast.success("Kategori berhasil disimpan");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Kategori gagal disimpan"); }
  }
  async function remove(category: Category) {
    if (!window.confirm(`Hapus kategori ${category.name}? Transaksi akan tetap tersimpan tanpa kategori, dan anggaran terkait ikut dihapus.`)) return;
    try {
      await apiClient(`/api/categories/${category.id}`, { method: "DELETE" });
      await client.invalidateQueries({ queryKey: ["categories"] }); toast.success("Kategori dihapus");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Kategori gagal dihapus"); }
  }
  async function mutateSub(category: Category, subId?: string) {
    const old = category.subCategories.find((sub) => sub.id === subId);
    const value = window.prompt(old ? "Ubah nama subkategori" : "Nama subkategori", old?.name || "");
    if (!value?.trim()) return;
    try {
      await apiClient(old ? `/api/subcategories/${old.id}` : `/api/categories/${category.id}/subcategories`, {
        method: old ? "PATCH" : "POST", body: JSON.stringify({ name: value }),
      });
      await client.invalidateQueries({ queryKey: ["categories"] }); toast.success("Subkategori disimpan");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Subkategori gagal disimpan"); }
  }
  async function deleteSub(id: string) {
    if (!window.confirm("Hapus subkategori ini?")) return;
    try {
      await apiClient(`/api/subcategories/${id}`, { method: "DELETE" });
      await client.invalidateQueries({ queryKey: ["categories"] }); toast.success("Subkategori dihapus");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Subkategori gagal dihapus"); }
  }
  return <>
    <PageHeader title="Kategori" description="Atur kategori pemasukan, pengeluaran, dan transfer."
      actions={<Button onClick={() => { setEditing(null); setName(""); setIcon("circle"); setColor("#64748b"); setOpen(true); }}><Plus className="mr-2 size-4" />Tambah Kategori</Button>} />
    <Tabs value={type} onValueChange={(value) => setType(value as typeof type)}>
      <TabsList>{types.map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}</TabsList>
      {types.map(([value]) => <TabsContent key={value} value={value}>
        {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => void query.refetch()} /> :
          !query.data?.length ? <EmptyState title="Belum ada kategori" description="Buat kategori untuk mengelompokkan transaksi." /> :
            <div className="mt-4 grid gap-3 md:grid-cols-2">{query.data.map((category) => <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><CategoryIcon name={category.icon} color={category.color} /><strong>{category.name}</strong></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Ubah" onClick={() => { setEditing(category); setName(category.name); setIcon(category.icon); setColor(category.color); setOpen(true); }}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => void remove(category)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {category.subCategories.map((sub) => <span key={sub.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                    {sub.name}<button aria-label={`Ubah ${sub.name}`} onClick={() => void mutateSub(category, sub.id)}>✎</button><button aria-label={`Hapus ${sub.name}`} onClick={() => void deleteSub(sub.id)}>×</button>
                  </span>)}
                  <Button variant="outline" size="sm" onClick={() => void mutateSub(category)}><Plus className="mr-1 size-3" />Subkategori</Button>
                </div>
              </CardContent>
            </Card>)}</div>}
      </TabsContent>)}
    </Tabs>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Ubah Kategori" : "Tambah Kategori"}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={(event) => void save(event)}>
        <Input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama kategori" />
        <ColorPicker value={color} onChange={setColor} />
        <IconPicker value={icon} onChange={(value) => setIcon(value)} />
        <Button className="w-full">Simpan</Button>
      </form>
    </DialogContent></Dialog>
  </>;
}
