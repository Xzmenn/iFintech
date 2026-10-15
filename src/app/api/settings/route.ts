import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { getSettings, updateSettings } from "@/server/services/settings";

export const GET = withApi(async () => {
  const user = await requireUser();
  return NextResponse.json(await getSettings(user.id));
});

export const PATCH = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  return NextResponse.json(await updateSettings(user.id, await request.json()));
});
