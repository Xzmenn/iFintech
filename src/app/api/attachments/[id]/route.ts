import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { withApi } from "@/server/api-handler";
import { deleteAttachment, getAttachment } from "@/server/services/attachment";

type Context = { params: Promise<{ id: string }> };

export const GET = withApi<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const { attachment, content } = await getAttachment(user.id, (await params).id);
  const filename = encodeURIComponent(attachment.fileName);
  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(attachment.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, no-store",
    },
  });
});

export const DELETE = withApi<Context>(async (_request, { params }) => {
  const user = await requireUser();
  return NextResponse.json(await deleteAttachment(user.id, (await params).id));
});
