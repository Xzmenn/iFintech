import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { createRecurring, listRecurring } from "@/server/services/recurring";

export const GET = withApi(async () => {
  const user = await requireUser();
  return NextResponse.json(await listRecurring(user.id));
});

export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  return NextResponse.json(await createRecurring(user.id, await request.json()), { status: 201 });
});
