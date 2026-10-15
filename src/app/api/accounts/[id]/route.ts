import { NextResponse } from "next/server";
import { accountUpdateSchema } from "@/lib/validations/account";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { deleteAccount, getAccount, updateAccount } from "@/server/services/account";

type Context = { params: Promise<{ id: string }> };

export const GET = withApi<Context>(async (_request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await getAccount(user.id, (await params).id));
});

export const PATCH = withApi<Context>(async (request, { params }) => {
  const user = await requireUser();
  const input = accountUpdateSchema.parse(await request.json());
  return NextResponse.json(await updateAccount(user.id, (await params).id, input));
});

export const DELETE = withApi<Context>(async (_request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await deleteAccount(user.id, (await params).id));
});
