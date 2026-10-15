import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { notFound } from "@/server/errors";
import { getAvatar } from "@/server/services/profile";

type RouteContext = { params: Promise<{ userId: string }> };

export const runtime = "nodejs";

export const GET = withApi<RouteContext>(async (request: NextRequest, context) => {
  const user = await requireUser();
  const { userId } = await context.params;
  if (user.id !== userId) throw notFound("Foto profil tidak ditemukan");
  const mimeType = request.nextUrl.searchParams.get("type") || "image/jpeg";
  const version = request.nextUrl.searchParams.get("v") || "";
  const file = await getAvatar(user.id, mimeType, version);
  const body = new ArrayBuffer(file.byteLength);
  new Uint8Array(body).set(file);
  return new NextResponse(body, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
