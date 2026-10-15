import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { changePassword } from "@/server/services/profile";

export const PATCH = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  return NextResponse.json(await changePassword(user.id, await request.json()));
});
