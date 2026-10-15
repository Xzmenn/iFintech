import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { createBudget, listBudgets } from "@/server/services/budget";

export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const current = new Date();
  const query = z
    .object({
      year: z.coerce.number().int().min(1900).max(9999),
      month: z.coerce.number().int().min(1).max(12),
    })
    .parse({
      year: request.nextUrl.searchParams.get("year") || current.getFullYear(),
      month: request.nextUrl.searchParams.get("month") || current.getMonth() + 1,
    });
  return NextResponse.json(await listBudgets(user.id, query.year, query.month));
});

export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  return NextResponse.json(await createBudget(user.id, await request.json()), { status: 201 });
});
