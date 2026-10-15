import { NextResponse, type NextRequest } from "next/server";
import { transactionSchema } from "@/lib/validations/transaction";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { createTransaction, listTransactions } from "@/server/services/transaction";

export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  return NextResponse.json(await listTransactions(user.id, request.nextUrl.searchParams));
});

export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const result = await createTransaction(user.id, transactionSchema.parse(await request.json()));
  return NextResponse.json(result, { status: 201 });
});
