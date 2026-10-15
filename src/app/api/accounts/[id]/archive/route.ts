import { NextResponse, type NextRequest } from "next/server";
import { accountArchiveSchema } from "@/lib/validations/account";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { setAccountArchived } from "@/server/services/account";

type Context = { params: Promise<{ id: string }> };

export const POST = withApi<Context>(async (request: NextRequest, { params }) => {
  const user = await requireUser();
  const { archived } = accountArchiveSchema.parse(await request.json());
  return NextResponse.json(await setAccountArchived(user.id, (await params).id, archived));
});
