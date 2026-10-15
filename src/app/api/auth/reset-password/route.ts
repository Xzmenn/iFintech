import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { withApi } from "@/server/api-handler";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";

export const POST = withApi(async (request: NextRequest) => {
  const { token, password } = resetPasswordSchema.parse(await request.json());
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw new AppError(400, "Tautan reset kata sandi tidak valid atau sudah kedaluwarsa");
    }
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw new AppError(400, "Tautan reset kata sandi tidak valid atau sudah kedaluwarsa");
    }
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
  });

  return NextResponse.json({ message: "Kata sandi berhasil diperbarui." });
});
