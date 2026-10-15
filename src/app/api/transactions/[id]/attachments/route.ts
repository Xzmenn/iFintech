import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "@/server/errors";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { createAttachment } from "@/server/services/attachment";

type Context = { params: Promise<{ id: string }> };

export const POST = withApi<Context>(async (request: NextRequest, { params }) => {
  const user = await requireUser();
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) throw new AppError(400, "Pilih file lampiran");
  if (file.size > 5 * 1024 * 1024) throw new AppError(400, "Ukuran lampiran maksimal 5 MB");
  if (!(file.type.startsWith("image/") || file.type === "application/pdf")) {
    throw new AppError(400, "Lampiran hanya boleh berupa gambar atau PDF");
  }
  const result = await createAttachment(user.id, (await params).id, {
    buffer: Buffer.from(await file.arrayBuffer()),
    name: file.name,
    type: file.type,
  });
  return NextResponse.json(result, { status: 201 });
});
