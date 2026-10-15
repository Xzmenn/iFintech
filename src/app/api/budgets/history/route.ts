import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { budgetHistory } from "@/server/services/budget";

const querySchema = z.object({
  categoryId: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(9999),
  month: z.coerce.number().int().min(1).max(12),
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const current = new Date();
  const query = querySchema.parse({
    categoryId: request.nextUrl.searchParams.get("categoryId"),
    year: request.nextUrl.searchParams.get("year") || current.getFullYear(),
    month: request.nextUrl.searchParams.get("month") || current.getMonth() + 1,
    months: request.nextUrl.searchParams.get("months") || 6,
  });
  return NextResponse.json(
    await budgetHistory(user.id, query.categoryId, query.year, query.month, query.months),
  );
});
