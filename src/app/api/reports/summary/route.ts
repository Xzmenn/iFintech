import { NextResponse, type NextRequest } from "next/server";
import { reportsPeriodSchema } from "@/lib/validations/reports";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { reportSummary } from "@/server/services/report";

export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const period = reportsPeriodSchema.parse({
    from: request.nextUrl.searchParams.get("from"),
    to: request.nextUrl.searchParams.get("to"),
  });
  return NextResponse.json(await reportSummary(user.id, period.from, period.to));
});
