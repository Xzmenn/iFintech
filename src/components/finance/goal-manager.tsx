"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useCurrencyFormatter } from "@/hooks/use-settings";
import { useAccounts, useGoals, type Goal } from "@/hooks/use-finance";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { MoneyInput } from "@/components/shared/money-input";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/shared/color-picker";
import { IconPicker } from "@/components/shared/icon-picker";

export function GoalManager() {
  const formatCurrency = useCurrencyFormatter();
  const query = useGoals();
  const accountsQuery = useAccounts();
  const client = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [accountId, setAccountId] = useState("none");
  const [color, setColor] = useState("#22c55e");
  const [icon, setIcon] = useState("target");
  const [note, setNote] = useState("");
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [contributionType, setContributionType] = useState<"SETORAN" | "PENARIKAN">("SETORAN");
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().slice(0, 10));
  const [contributionNote, setContributionNote] = useState("");
  const goals = query.data || [];
  const contributionGoal = goals.find((goal) => goal.id === contributionGoalId);

  function start(goal?: Goal) {
    setEditing(goal || null);
    setName(goal?.name || "");
    setTargetAmount(goal?.targetAmount || 0);
    setDeadline(goal?.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : "");
    setAccountId(goal?.accountId || "none");
    setColor(goal?.color || "#22c55e");
    setIcon(goal?.icon || "target");
    setNote(goal?.note || "");
    setEditorOpen(true);
  }

  async function saveGoal(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiClient(editing ? `/api/goals/${editing.id}` : "/api/goals", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          name,
          targetAmount,
          deadline: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : null,
          accountId: accountId === "none" ? null : accountId,
          color,
          icon,
          note,
        }),
      });
      await client.invalidateQueries({ queryKey: ["goals"] });
      setEditorOpen(false);
      toast.success("Target berhasil disimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Target gagal disimpan");
    }
  }

  async function deleteGoal(goal: Goal) {
    if (!window.confirm(`Hapus target "${goal.name}" dan seluruh catatan kontribusinya?`)) return;
    try {
      await apiClient(`/api/goals/${goal.id}`, { method: "DELETE" });
      await client.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Target dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Target gagal dihapus");
    }
  }

  async function saveContribution(event: React.FormEvent) {
    event.preventDefault();
    if (!contributionGoalId) return;
    try {
      await apiClient(`/api/goals/${contributionGoalId}/contributions`, {
        method: "POST",
        body: JSON.stringify({
          type: contributionType,
          amount: contributionAmount,
          date: new Date(`${contributionDate}T12:00:00`).toISOString(),
          note: contributionNote,
        }),
      });
      await client.invalidateQueries({ queryKey: ["goals"] });
      setContributionAmount(0);
      setContributionNote("");
      toast.success(contributionType === "SETORAN" ? "Setoran dicatat" : "Penarikan dicatat");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kontribusi gagal disimpan");
    }
  }

  async function deleteContribution(goalId: string, contributionId: string) {
    if (!window.confirm("Hapus catatan kontribusi ini?")) return;
    try {
      await apiClient(`/api/goals/${goalId}/contributions/${contributionId}`, {
        method: "DELETE",
      });
      await client.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Kontribusi dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kontribusi gagal dihapus");
    }
  }

  return (
    <>
      <PageHeader
        title="Target Keuangan"
        description="Pantau progres tujuan tabungan Anda."
        actions={
          <Button onClick={() => start()}>
            <Plus className="mr-2 size-4" />
            Tambah Target
          </Button>
        }
      />
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : !goals.length ? (
        <EmptyState
          title="Belum ada target"
          description="Buat target untuk memantau rencana keuangan Anda."
          action={<Button onClick={() => start()}>Tambah Target</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => {
            const daysRemaining = goal.deadline
              ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000)
              : null;
            return (
              <Card key={goal.id}>
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CategoryIcon
                      name={goal.icon}
                      color={goal.color}
                      className="size-10 rounded-xl"
                    />
                    <div>
                      <CardTitle className="text-base">{goal.name}</CardTitle>
                      {goal.account && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Akun terkait: {goal.account.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ubah target ${goal.name}`}
                      onClick={() => start(goal)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus target ${goal.name}`}
                      onClick={() => void deleteGoal(goal)}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <strong className="text-lg">
                      {formatCurrency(goal.saved)}{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        / {formatCurrency(goal.targetAmount)}
                      </span>
                    </strong>
                    <Badge
                      variant={
                        goal.isCompleted ? "default" : goal.onTrack ? "secondary" : "outline"
                      }
                    >
                      {goal.isCompleted
                        ? "Tercapai"
                        : goal.onTrack
                          ? "Sesuai rencana"
                          : "Perlu perhatian"}
                    </Badge>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${goal.percent}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1 text-right text-xs">{goal.percent}%</p>
                  <div className="text-muted-foreground mt-3 grid gap-1 text-sm sm:grid-cols-2">
                    <p>
                      Tenggat: {goal.deadline ? formatDate(goal.deadline) : "Tidak ditentukan"}
                      {daysRemaining !== null &&
                        (daysRemaining >= 0 ? ` · ${daysRemaining} hari lagi` : " · Tenggat lewat")}
                    </p>
                    <p>
                      Estimasi:{" "}
                      {goal.isCompleted
                        ? "Sudah tercapai"
                        : goal.estimatedDate
                          ? formatDate(goal.estimatedDate)
                          : "Belum bisa diestimasi"}
                    </p>
                    <p>Rata-rata per bulan: {formatCurrency(goal.monthlyAverage)}</p>
                    <p>
                      Dibutuhkan per bulan:{" "}
                      {goal.requiredPerMonth === null ? "—" : formatCurrency(goal.requiredPerMonth)}
                    </p>
                  </div>
                  {goal.note && <p className="mt-2 text-sm">{goal.note}</p>}
                  <Button
                    className="mt-4 w-full"
                    variant="outline"
                    onClick={() => {
                      setContributionGoalId(goal.id);
                      setContributionDate(new Date().toISOString().slice(0, 10));
                    }}
                  >
                    Catat Setoran / Penarikan
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah Target" : "Tambah Target"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void saveGoal(event)}>
            <div className="space-y-1">
              <Label htmlFor="goal-name">Nama target</Label>
              <Input
                id="goal-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Jumlah target</Label>
              <MoneyInput value={targetAmount} onChange={setTargetAmount} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goal-deadline">Tenggat (opsional)</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Akun terkait (opsional)</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa akun terkait</SelectItem>
                  {(accountsQuery.data?.items || []).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-4">
              <ColorPicker value={color} onChange={setColor} />
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goal-note">Catatan</Label>
              <Input
                id="goal-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            <Button className="w-full" type="submit">
              Simpan Target
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(contributionGoalId)}
        onOpenChange={(open) => !open && setContributionGoalId(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kontribusi · {contributionGoal?.name}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(event) => void saveContribution(event)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Jenis</Label>
                <Select
                  value={contributionType}
                  onValueChange={(value) => setContributionType(value as typeof contributionType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SETORAN">Setoran</SelectItem>
                    <SelectItem value="PENARIKAN">Penarikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="contribution-date">Tanggal</Label>
                <Input
                  id="contribution-date"
                  type="date"
                  required
                  value={contributionDate}
                  onChange={(event) => setContributionDate(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Jumlah</Label>
              <MoneyInput value={contributionAmount} onChange={setContributionAmount} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contribution-note">Catatan</Label>
              <Input
                id="contribution-note"
                value={contributionNote}
                onChange={(event) => setContributionNote(event.target.value)}
              />
            </div>
            <Button className="w-full" type="submit">
              Simpan Kontribusi
            </Button>
          </form>
          <div className="space-y-2 border-t pt-4">
            <h3 className="font-medium">Riwayat kontribusi</h3>
            {!contributionGoal?.contributions.length ? (
              <p className="text-muted-foreground text-sm">Belum ada kontribusi.</p>
            ) : (
              contributionGoal.contributions.map((contribution) => (
                <div
                  className="flex items-center justify-between gap-3 text-sm"
                  key={contribution.id}
                >
                  <div>
                    <p className="font-medium">
                      {formatCurrency(Math.abs(contribution.amount))}
                      {contribution.amount < 0 ? " · Penarikan" : " · Setoran"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(contribution.date)}
                      {contribution.note && ` · ${contribution.note}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => void deleteContribution(contributionGoal.id, contribution.id)}
                  >
                    Hapus
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
