import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { createUserBackup } from "@/server/services/backup";

export const runtime = "nodejs";

export const GET = withApi(async () => {
  const user = await requireUser();
  const backup = await createUserBackup(user.id);
  const filename = `ifintech-backup-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
