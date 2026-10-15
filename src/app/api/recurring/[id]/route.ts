import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { deleteRecurring, updateRecurring } from "@/server/services/recurring";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withApi<Context>(async (request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await updateRecurring(user.id, (await params).id, await request.json()));
});

export const DELETE = withApi<Context>(async (_request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await deleteRecurring(user.id, (await params).id));
});
