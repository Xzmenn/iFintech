import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { reportDateRangeSchema } from "@/lib/validations/reports";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { reportCategoryBreakdown } from "@/server/services/report";

const querySchema = reportDateRangeSchema
  .extend({ type: z.enum(["INCOME", "EXPENSE"]).default("EXPENSE") })
  .refine((period) => period.from <= period.to, {
    message: "Periode tidak valid",
    path: ["to"],
  });

export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const query = querySchema.parse({
    from: request.nextUrl.searchParams.get("from"),
    to: request.nextUrl.searchParams.get("to"),
    type: request.nextUrl.searchParams.get("type") || "EXPENSE",
  });
  return NextResponse.json(
    await reportCategoryBreakdown(user.id, query.from, query.to, query.type),
  );
});
