import { Prisma } from "@prisma/client";
import { serialize } from "@/lib/serialize";
import { restoreBackupSchema } from "@/lib/validations/backup";
import { db } from "@/server/db";
import { recalculateBalances } from "@/server/services/balance";

export async function createUserBackup(userId: string) {
  const [
    setting,
    accounts,
    categories,
    subCategories,
    transactions,
    tags,
    transactionTags,
    attachments,
    budgets,
    goals,
    goalContributions,
    recurringTransactions,
  ] = await db.$transaction([
    db.setting.findUnique({ where: { userId } }),
    db.account.findMany({ where: { userId } }),
    db.category.findMany({ where: { userId } }),
    db.subCategory.findMany({ where: { category: { userId } } }),
    db.transaction.findMany({ where: { userId } }),
    db.tag.findMany({ where: { userId } }),
    db.transactionTag.findMany({ where: { transaction: { userId } } }),
    db.attachment.findMany({ where: { userId } }),
    db.budget.findMany({ where: { userId } }),
    db.goal.findMany({ where: { userId } }),
    db.goalContribution.findMany({ where: { goal: { userId } } }),
    db.recurringTransaction.findMany({ where: { userId } }),
  ]);
  return {
    version: 1,
    exportedAt: new Date(),
    data: serialize({
      setting,
      accounts,
      categories,
      subCategories,
      transactions,
      tags,
      transactionTags,
      attachments,
      budgets,
      goals,
      goalContributions,
      recurringTransactions,
    }),
  };
}

export async function restoreUserBackup(userId: string, input: unknown) {
  const { backup } = restoreBackupSchema.parse(input);
  return db.$transaction(async (tx) => {
    await tx.budget.deleteMany({ where: { userId } });
    await tx.goal.deleteMany({ where: { userId } });
    await tx.recurringTransaction.deleteMany({ where: { userId } });
    await tx.attachment.deleteMany({ where: { userId } });
    await tx.transaction.deleteMany({ where: { userId } });
    await tx.tag.deleteMany({ where: { userId } });
    await tx.category.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });

    const accountIds = new Map<string, string>();
    for (const account of backup.data.accounts) {
      const created = await tx.account.create({
        data: {
          userId,
          name: account.name,
          type: account.type,
          initialBalance: new Prisma.Decimal(account.initialBalance),
          balance: new Prisma.Decimal(account.initialBalance),
          creditLimit:
            account.creditLimit === null || account.creditLimit === undefined
              ? null
              : new Prisma.Decimal(account.creditLimit),
          currency: account.currency,
          color: account.color,
          icon: account.icon,
          note: account.note || null,
          isArchived: account.isArchived,
        },
      });
      accountIds.set(account.id, created.id);
    }

    const categoryIds = new Map<string, string>();
    for (const category of backup.data.categories) {
      const created = await tx.category.create({
        data: {
          userId,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          isDefault: category.isDefault,
        },
      });
      categoryIds.set(category.id, created.id);
    }

    const subCategoryIds = new Map<string, string>();
    for (const subCategory of backup.data.subCategories) {
      const categoryId = categoryIds.get(subCategory.categoryId);
      if (!categoryId) continue;
      const created = await tx.subCategory.create({
        data: { categoryId, name: subCategory.name },
      });
      subCategoryIds.set(subCategory.id, created.id);
    }

    const tagIds = new Map<string, string>();
    for (const tag of backup.data.tags) {
      const created = await tx.tag.create({
        data: { userId, name: tag.name, color: tag.color },
      });
      tagIds.set(tag.id, created.id);
    }

    const recurringIds = new Map<string, string>();
    for (const rule of backup.data.recurringTransactions) {
      const accountId = accountIds.get(rule.accountId);
      if (!accountId) continue;
      const created = await tx.recurringTransaction.create({
        data: {
          userId,
          type: rule.type,
          amount: new Prisma.Decimal(rule.amount),
          accountId,
          toAccountId: rule.toAccountId ? accountIds.get(rule.toAccountId) || null : null,
          categoryId: rule.categoryId ? categoryIds.get(rule.categoryId) || null : null,
          subCategoryId: rule.subCategoryId ? subCategoryIds.get(rule.subCategoryId) || null : null,
          note: rule.note || null,
          tagNames: rule.tagNames || null,
          frequency: rule.frequency,
          interval: rule.interval,
          startDate: rule.startDate,
          endDate: rule.endDate || null,
          nextRunDate: rule.nextRunDate,
          lastRunDate: rule.lastRunDate || null,
          isActive: rule.isActive,
        },
      });
      recurringIds.set(rule.id, created.id);
    }

    const transactionIds = new Map<string, string>();
    for (const transaction of backup.data.transactions) {
      const accountId = accountIds.get(transaction.accountId);
      if (!accountId) continue;
      const created = await tx.transaction.create({
        data: {
          userId,
          type: transaction.type,
          amount: new Prisma.Decimal(transaction.amount),
          date: transaction.date,
          accountId,
          toAccountId: transaction.toAccountId
            ? accountIds.get(transaction.toAccountId) || null
            : null,
          categoryId: transaction.categoryId
            ? categoryIds.get(transaction.categoryId) || null
            : null,
          subCategoryId: transaction.subCategoryId
            ? subCategoryIds.get(transaction.subCategoryId) || null
            : null,
          note: transaction.note || null,
          recurringId: transaction.recurringId
            ? recurringIds.get(transaction.recurringId) || null
            : null,
        },
      });
      transactionIds.set(transaction.id, created.id);
    }

    for (const relation of backup.data.transactionTags) {
      const transactionId = transactionIds.get(relation.transactionId);
      const tagId = tagIds.get(relation.tagId);
      if (transactionId && tagId) {
        await tx.transactionTag.create({ data: { transactionId, tagId } });
      }
    }
    for (const attachment of backup.data.attachments) {
      const transactionId = transactionIds.get(attachment.transactionId);
      if (!transactionId) continue;
      await tx.attachment.create({
        data: {
          userId,
          transactionId,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          storageKey: attachment.storageKey,
        },
      });
    }
    for (const budget of backup.data.budgets) {
      const categoryId = categoryIds.get(budget.categoryId);
      if (!categoryId) continue;
      await tx.budget.create({
        data: {
          userId,
          categoryId,
          year: budget.year,
          month: budget.month,
          amount: new Prisma.Decimal(budget.amount),
          alertThreshold: budget.alertThreshold,
          note: budget.note || null,
        },
      });
    }

    const goalIds = new Map<string, string>();
    for (const goal of backup.data.goals) {
      const created = await tx.goal.create({
        data: {
          userId,
          name: goal.name,
          targetAmount: new Prisma.Decimal(goal.targetAmount),
          deadline: goal.deadline || null,
          accountId: goal.accountId ? accountIds.get(goal.accountId) || null : null,
          color: goal.color,
          icon: goal.icon,
          note: goal.note || null,
          isCompleted: goal.isCompleted,
        },
      });
      goalIds.set(goal.id, created.id);
    }
    for (const contribution of backup.data.goalContributions) {
      const goalId = goalIds.get(contribution.goalId);
      if (!goalId) continue;
      await tx.goalContribution.create({
        data: {
          goalId,
          amount: new Prisma.Decimal(contribution.amount),
          date: contribution.date,
          note: contribution.note || null,
        },
      });
    }

    if (backup.data.setting) {
      const setting = backup.data.setting;
      await tx.setting.upsert({
        where: { userId },
        create: {
          userId,
          currency: setting.currency,
          locale: setting.locale,
          theme: setting.theme,
          weekStartsOn: setting.weekStartsOn,
          budgetAlertThreshold: setting.budgetAlertThreshold,
        },
        update: {
          currency: setting.currency,
          locale: setting.locale,
          theme: setting.theme,
          weekStartsOn: setting.weekStartsOn,
          budgetAlertThreshold: setting.budgetAlertThreshold,
        },
      });
    }

    await recalculateBalances(tx, userId, Array.from(accountIds.values()));
    return {
      restored: true,
      accounts: accountIds.size,
      categories: categoryIds.size,
      transactions: transactionIds.size,
      goals: goalIds.size,
    };
  });
}
