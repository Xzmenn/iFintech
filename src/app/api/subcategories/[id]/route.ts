import { NextResponse } from "next/server";
import { subCategoryUpdateSchema } from "@/lib/validations/category";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { deleteSubCategory, updateSubCategory } from "@/server/services/category";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withApi<Context>(async (request, { params }) => {
  const user = await requireUser();
  const { name } = subCategoryUpdateSchema.parse(await request.json());
  return NextResponse.json(await updateSubCategory(user.id, (await params).id, name));
});

export const DELETE = withApi<Context>(async (_request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await deleteSubCategory(user.id, (await params).id));
});
