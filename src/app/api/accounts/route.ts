import { NextResponse, type NextRequest } from "next/server";
import { accountSchema } from "@/lib/validations/account";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { createAccount, listAccounts } from "@/server/services/account";

export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";
  return NextResponse.json(await listAccounts(user.id, includeArchived));
});

export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const input = accountSchema.parse(await request.json());
  return NextResponse.json(await createAccount(user.id, input), { status: 201 });
});
