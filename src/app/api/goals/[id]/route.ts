import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { deleteGoal, updateGoal } from "@/server/services/goal";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withApi<Context>(async (request: NextRequest, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return NextResponse.json(await updateGoal(user.id, id, await request.json()));
});

export const DELETE = withApi<Context>(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return NextResponse.json(await deleteGoal(user.id, id));
});
