import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { createContribution, listContributions } from "@/server/services/goal";

type Context = { params: Promise<{ id: string }> };

export const GET = withApi<Context>(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return NextResponse.json(await listContributions(user.id, id));
});

export const POST = withApi<Context>(async (request: NextRequest, context) => {
  const user = await requireUser();
  const { id } = await context.params;
  return NextResponse.json(await createContribution(user.id, id, await request.json()), {
    status: 201,
  });
});
