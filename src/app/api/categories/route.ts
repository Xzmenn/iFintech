import { NextResponse, type NextRequest } from "next/server";
import { categorySchema } from "@/lib/validations/category";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { createCategory, listCategories } from "@/server/services/category";

export const GET = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const type = request.nextUrl.searchParams.get("type");
  return NextResponse.json(
    await listCategories(user.id, type as "INCOME" | "EXPENSE" | "TRANSFER" | undefined),
  );
});

export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  return NextResponse.json(
    await createCategory(user.id, categorySchema.parse(await request.json())),
    { status: 201 },
  );
});
