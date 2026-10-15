import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { getProfile, updateProfile } from "@/server/services/profile";

export const GET = withApi(async () => {
  const user = await requireUser();
  return NextResponse.json(await getProfile(user.id));
});

export const PATCH = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  return NextResponse.json(await updateProfile(user.id, await request.json()));
});
