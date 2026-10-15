import { Prisma } from "@prisma/client";
import { estimateGoalCompletion } from "@/lib/goal";
import { goalContributionSchema, goalSchema, goalUpdateSchema } from "@/lib/validations/goal";
import { serialize } from "@/lib/serialize";
import { AppError, notFound } from "@/server/errors";
import { db } from "@/server/db";

async function validateAccount(userId: string, accountId?: string | null) {
  if (!accountId) return;
  const account = await db.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw notFound("Akun tidak ditemukan");
}

function withProgress<
  T extends {
    targetAmount: Prisma.Decimal;
    deadline: Date | null;
    contributions: { amount: Prisma.Decimal; date: Date }[];
  },
>(goal: T) {
  const saved = goal.contributions.reduce(
    (sum, contribution) => sum + Number(contribution.amount),
    0,
  );
  return {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    saved,
    ...estimateGoalCompletion(
      saved,
      Number(goal.targetAmount),
      goal.contributions.map((contribution) => ({
        amount: Number(contribution.amount),
        date: contribution.date,
      })),
      goal.deadline,
    ),
  };
}

export async function listGoals(userId: string) {
  const goals = await db.goal.findMany({
    where: { userId },
    include: {
      account: true,
      contributions: { orderBy: { date: "desc" } },
    },
    orderBy: [{ isCompleted: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
  });
  return serialize(goals.map(withProgress));
}

export async function createGoal(userId: string, input: unknown) {
  const data = goalSchema.parse(input);
  await validateAccount(userId, data.accountId);
  const goal = await db.goal.create({
    data: { ...data, userId, targetAmount: new Prisma.Decimal(data.targetAmount) },
    include: { account: true, contributions: true },
  });
  return serialize(withProgress(goal));
}

export async function updateGoal(userId: string, id: string, input: unknown) {
  const owned = await db.goal.findFirst({
    where: { id, userId },
    include: { contributions: true },
  });
  if (!owned) throw notFound("Target tidak ditemukan");
  const data = goalUpdateSchema.parse(input);
  await validateAccount(userId, data.accountId);
  const targetAmount =
    data.targetAmount === undefined ? Number(owned.targetAmount) : data.targetAmount;
  const saved = owned.contributions.reduce(
    (sum, contribution) => sum + Number(contribution.amount),
    0,
  );
  const goal = await db.goal.update({
    where: { id },
    data: {
      ...data,
      ...(data.targetAmount !== undefined
        ? { targetAmount: new Prisma.Decimal(data.targetAmount) }
        : {}),
      isCompleted: saved >= targetAmount,
    },
    include: { account: true, contributions: { orderBy: { date: "desc" } } },
  });
  return serialize(withProgress(goal));
}

export async function deleteGoal(userId: string, id: string) {
  const result = await db.goal.deleteMany({ where: { id, userId } });
  if (!result.count) throw notFound("Target tidak ditemukan");
  return { id };
}

export async function listContributions(userId: string, goalId: string) {
  const goal = await db.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw notFound("Target tidak ditemukan");
  return serialize(
    await db.goalContribution.findMany({
      where: { goalId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
  );
}

export async function createContribution(userId: string, goalId: string, input: unknown) {
  const data = goalContributionSchema.parse(input);
  return db.$transaction(async (tx) => {
    const goal = await tx.goal.findFirst({
      where: { id: goalId, userId },
      include: { contributions: true },
    });
    if (!goal) throw notFound("Target tidak ditemukan");
    const amount = data.type === "PENARIKAN" ? -data.amount : data.amount;
    const savedBefore = goal.contributions.reduce((sum, item) => sum + Number(item.amount), 0);
    if (amount < 0 && Math.abs(amount) > savedBefore) {
      throw new AppError(422, "Penarikan melebihi jumlah tabungan yang tersedia");
    }
    const contribution = await tx.goalContribution.create({
      data: {
        goalId,
        amount: new Prisma.Decimal(amount),
        date: data.date,
        note: data.note,
      },
    });
    const saved = savedBefore + amount;
    await tx.goal.update({
      where: { id: goalId },
      data: { isCompleted: saved >= Number(goal.targetAmount) },
    });
    return serialize(contribution);
  });
}

export async function deleteContribution(userId: string, goalId: string, contributionId: string) {
  return db.$transaction(async (tx) => {
    const goal = await tx.goal.findFirst({
      where: { id: goalId, userId },
      include: { contributions: true },
    });
    if (!goal) throw notFound("Target tidak ditemukan");
    const contribution = goal.contributions.find((item) => item.id === contributionId);
    if (!contribution) throw notFound("Kontribusi tidak ditemukan");
    await tx.goalContribution.delete({ where: { id: contributionId } });
    const saved = goal.contributions
      .filter((item) => item.id !== contributionId)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    await tx.goal.update({
      where: { id: goalId },
      data: { isCompleted: saved >= Number(goal.targetAmount) },
    });
    return { id: contributionId };
  });
}
