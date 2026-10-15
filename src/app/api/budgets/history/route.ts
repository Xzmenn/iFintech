import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { budgetHistory } from "@/server/services/budget";

const querySchema = z.object({
  categoryId: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(9999),
  month: z.coerce.number().int().min(1).max(12),
});

export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const query = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json(await budgetHistory(user.id, query.categoryId, query.year, query.month));
});
