import { z } from "zod";

const id = z.string().min(1);
const date = z.coerce.date();
const nullableDate = date.nullable().optional();
const nullableText = z.string().nullable().optional();
const amount = z.coerce.number().finite();

const accountSchema = z
  .object({
    id,
    name: z.string().min(1),
    type: z.enum(["CASH", "BANK", "EWALLET", "CREDIT_CARD", "INVESTMENT"]),
    initialBalance: amount,
    balance: amount.optional(),
    creditLimit: z.number().finite().nullable().optional(),
    currency: z.string().default("IDR"),
    color: z.string().default("#0ea5e9"),
    icon: z.string().default("wallet"),
    note: nullableText,
    isArchived: z.boolean().default(false),
  })
  .passthrough();

const categorySchema = z
  .object({
    id,
    name: z.string().min(1),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    icon: z.string().default("circle"),
    color: z.string().default("#64748b"),
    isDefault: z.boolean().default(false),
  })
  .passthrough();

const subCategorySchema = z.object({ id, categoryId: id, name: z.string().min(1) }).passthrough();

const transactionSchema = z
  .object({
    id,
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    amount: amount.positive(),
    date,
    accountId: id,
    toAccountId: id.nullable().optional(),
    categoryId: id.nullable().optional(),
    subCategoryId: id.nullable().optional(),
    note: nullableText,
    recurringId: id.nullable().optional(),
  })
  .passthrough();

const tagSchema = z
  .object({ id, name: z.string().min(1), color: z.string().default("#64748b") })
  .passthrough();
const transactionTagSchema = z.object({ transactionId: id, tagId: id }).passthrough();
const attachmentSchema = z
  .object({
    id,
    transactionId: id,
    fileName: z.string(),
    mimeType: z.string(),
    size: z.number().int().nonnegative(),
    storageKey: z.string().min(1),
  })
  .passthrough();
const budgetSchema = z
  .object({
    id,
    categoryId: id,
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    amount: amount.positive(),
    alertThreshold: z.number().int().min(1).max(100).default(80),
    note: nullableText,
  })
  .passthrough();
const goalSchema = z
  .object({
    id,
    name: z.string().min(1),
    targetAmount: amount.positive(),
    deadline: nullableDate,
    accountId: id.nullable().optional(),
    color: z.string().default("#22c55e"),
    icon: z.string().default("target"),
    note: nullableText,
    isCompleted: z.boolean().default(false),
  })
  .passthrough();
const contributionSchema = z
  .object({
    id,
    goalId: id,
    amount,
    date,
    note: nullableText,
  })
  .passthrough();
const recurringSchema = z
  .object({
    id,
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    amount: amount.positive(),
    accountId: id,
    toAccountId: id.nullable().optional(),
    categoryId: id.nullable().optional(),
    subCategoryId: id.nullable().optional(),
    note: nullableText,
    tagNames: z.string().nullable().optional(),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
    interval: z.number().int().positive().default(1),
    startDate: date,
    endDate: nullableDate,
    nextRunDate: date,
    lastRunDate: nullableDate,
    isActive: z.boolean().default(true),
  })
  .passthrough();
const settingSchema = z
  .object({
    currency: z.string().default("IDR"),
    locale: z.string().default("id-ID"),
    theme: z.enum(["light", "dark", "system"]).default("system"),
    weekStartsOn: z.number().int().min(0).max(1).default(1),
    budgetAlertThreshold: z.number().int().min(1).max(100).default(80),
  })
  .passthrough();

export const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: date.optional(),
  data: z
    .object({
      setting: settingSchema.nullable().optional(),
      accounts: z.array(accountSchema).default([]),
      categories: z.array(categorySchema).default([]),
      subCategories: z.array(subCategorySchema).default([]),
      transactions: z.array(transactionSchema).default([]),
      tags: z.array(tagSchema).default([]),
      transactionTags: z.array(transactionTagSchema).default([]),
      attachments: z.array(attachmentSchema).default([]),
      budgets: z.array(budgetSchema).default([]),
      goals: z.array(goalSchema).default([]),
      goalContributions: z.array(contributionSchema).default([]),
      recurringTransactions: z.array(recurringSchema).default([]),
    })
    .passthrough(),
});

export const restoreBackupSchema = z.object({
  confirm: z.literal("RESTORE"),
  backup: backupSchema,
});
