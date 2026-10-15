import { NextResponse, type NextRequest } from "next/server";
import { subCategorySchema } from "@/lib/validations/category";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { createSubCategory } from "@/server/services/category";

type Context = { params: Promise<{ id: string }> };

export const POST = withApi<Context>(async (request: NextRequest, { params }) => {
  const user = await requireUser();
  const { name } = subCategorySchema.parse({
    ...(await request.json()),
    categoryId: (await params).id,
  });
  return NextResponse.json(await createSubCategory(user.id, (await params).id, name), {
    status: 201,
  });
});
