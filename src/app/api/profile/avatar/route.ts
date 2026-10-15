import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { AppError } from "@/server/errors";
import { uploadAvatar } from "@/server/services/profile";

export const runtime = "nodejs";

export const POST = withApi(async (request: NextRequest) => {
  const user = await requireUser();
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) throw new AppError(400, "Pilih foto profil terlebih dahulu");
  if (!file.type.startsWith("image/")) throw new AppError(400, "File harus berupa gambar");
  if (file.size > 2 * 1024 * 1024) throw new AppError(413, "Ukuran foto maksimal 2 MB");
  return NextResponse.json(
    await uploadAvatar(user.id, Buffer.from(await file.arrayBuffer()), file.type),
  );
});
