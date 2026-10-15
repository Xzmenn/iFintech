import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { processDueRecurring } from "@/server/services/recurring";

export const POST = withApi(async () => {
  const user = await requireUser();
  return NextResponse.json(await processDueRecurring(user.id));
});
