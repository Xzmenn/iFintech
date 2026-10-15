import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "@/server/errors";
import { withApi } from "@/server/api-handler";
import { processAllDueRecurring } from "@/server/services/recurring";

export const POST = withApi(async (request: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    throw new AppError(401, "Tidak diizinkan");
  }
  return NextResponse.json(await processAllDueRecurring());
});
