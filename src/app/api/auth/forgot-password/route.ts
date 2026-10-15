import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { logger } from "@/lib/logger";
import { withApi } from "@/server/api-handler";
import { db } from "@/server/db";
import { sendPasswordResetEmail } from "@/server/mailer";

export const POST = withApi(async (request: NextRequest) => {
  const { email } = forgotPasswordSchema.parse(await request.json());
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true },
  });

  if (user) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const url = `${process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail({ to: user.email, url });
    } catch (error) {
      logger.error("Email reset kata sandi gagal dikirim", {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({
    message: "Jika email terdaftar, tautan untuk mengatur ulang kata sandi akan dikirim.",
  });
});
