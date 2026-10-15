import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { deleteContribution } from "@/server/services/goal";

type Context = { params: Promise<{ id: string; contributionId: string }> };

export const DELETE = withApi<Context>(async (_request, context) => {
  const user = await requireUser();
  const { id, contributionId } = await context.params;
  return NextResponse.json(await deleteContribution(user.id, id, contributionId));
});
