import { NextResponse } from "next/server";
import { transactionUpdateSchema } from "@/lib/validations/transaction";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import {
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from "@/server/services/transaction";

type Context = { params: Promise<{ id: string }> };

export const GET = withApi<Context>(async (_request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await getTransaction(user.id, (await params).id));
});

export const PATCH = withApi<Context>(async (request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(
    await updateTransaction(
      user.id,
      (await params).id,
      transactionUpdateSchema.parse(await request.json()),
    ),
  );
});

export const DELETE = withApi<Context>(async (_request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await deleteTransaction(user.id, (await params).id));
});
