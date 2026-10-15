import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { listTags } from "@/server/services/tag";

export const GET = withApi(async () => {
  const user = await requireUser();
  return NextResponse.json(await listTags(user.id));
});
