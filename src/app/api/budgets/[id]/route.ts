import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { deleteBudget, updateBudget } from "@/server/services/budget";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withApi<Context>(async (request: NextRequest, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return NextResponse.json(await updateBudget(user.id, id, await request.json()));
});

export const DELETE = withApi<Context>(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return NextResponse.json(await deleteBudget(user.id, id));
});
