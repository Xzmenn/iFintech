import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { copyPreviousMonthBudgets } from "@/server/services/budget";

const copySchema = z.object({
  year: z.coerce.number().int().min(1900).max(9999),
  month: z.coerce.number().int().min(1).max(12),
});

export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const data = copySchema.parse(await request.json());
  return NextResponse.json(await copyPreviousMonthBudgets(user.id, data.year, data.month));
});
