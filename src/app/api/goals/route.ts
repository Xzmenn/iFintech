import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { createGoal, listGoals } from "@/server/services/goal";

export const GET = withApi(async () => {
  const user = await requireUser();
  return NextResponse.json(await listGoals(user.id));
});

export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  return NextResponse.json(await createGoal(user.id, await request.json()), { status: 201 });
});
