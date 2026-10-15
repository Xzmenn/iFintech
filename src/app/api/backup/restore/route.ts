import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { restoreUserBackup } from "@/server/services/backup";

export const runtime = "nodejs";

export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  return NextResponse.json(await restoreUserBackup(user.id, await request.json()));
});
