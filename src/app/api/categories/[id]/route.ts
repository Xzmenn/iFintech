import { NextResponse } from "next/server";
import { categoryUpdateSchema } from "@/lib/validations/category";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { deleteCategory, getCategory, updateCategory } from "@/server/services/category";

type Context = { params: Promise<{ id: string }> };

export const GET = withApi<Context>(async (_request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await getCategory(user.id, (await params).id));
});

export const PATCH = withApi<Context>(async (request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await updateCategory(user.id, (await params).id, categoryUpdateSchema.parse(await request.json())));
});

export const DELETE = withApi<Context>(async (_request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await deleteCategory(user.id, (await params).id));
});
