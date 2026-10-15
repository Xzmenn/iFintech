import { NextResponse, type NextRequest } from "next/server";
import { netWorthQuerySchema } from "@/lib/validations/reports";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { reportNetWorth } from "@/server/services/report";

export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const query = netWorthQuerySchema.parse({
    months: request.nextUrl.searchParams.get("months") || 12,
  });
  return NextResponse.json(await reportNetWorth(user.id, query.months));
});
