import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { AppError } from "@/server/errors";

type Handler<C> = (request: NextRequest, context: C) => Promise<Response> | Response;

export function withApi<C = unknown>(handler: Handler<C>) {
  return async (request: NextRequest, context: C) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Data yang dimasukkan tidak valid",
            details: error.flatten(),
          },
          { status: 400 },
        );
      }
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message, ...(error.code ? { code: error.code } : {}) },
          { status: error.status },
        );
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return NextResponse.json(
            { error: "Data sudah terdaftar" },
            { status: 409 },
          );
        }
        if (error.code === "P2025") {
          return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
        }
      }
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Format JSON tidak valid" }, { status: 400 });
      }
      logger.error("Kesalahan API tidak tertangani", {
        path: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
    }
  };
}
