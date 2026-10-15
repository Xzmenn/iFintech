import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { profileSchema, changePasswordSchema } from "@/lib/validations/auth";
import { notFound, AppError } from "@/server/errors";
import { db } from "@/server/db";
import { storage } from "@/server/storage";

export async function getProfile(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true },
  });
  if (!user) throw notFound("Profil tidak ditemukan");
  return user;
}

export async function updateProfile(userId: string, input: unknown) {
  const data = profileSchema.parse(input);
  try {
    return await db.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        ...(data.image !== undefined ? { image: data.image } : {}),
      },
      select: { id: true, name: true, email: true, image: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "Email sudah digunakan");
    }
    throw error;
  }
}

export async function changePassword(userId: string, input: unknown) {
  const data = changePasswordSchema.parse(input);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("Pengguna tidak ditemukan");
  if (!(await bcrypt.compare(data.currentPassword, user.passwordHash))) {
    throw new AppError(422, "Kata sandi saat ini tidak sesuai");
  }
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(data.newPassword, 12) },
  });
  return { changed: true };
}

const avatarExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function avatarKey(userId: string, version: string, extension: string) {
  return `avatars/${userId}/avatar-${version}.${extension}`;
}

export async function uploadAvatar(userId: string, file: Buffer, mimeType: string) {
  const extension = avatarExtensions[mimeType];
  if (!extension) throw new AppError(400, "Format foto profil tidak didukung");
  const version = String(Date.now());
  const key = avatarKey(userId, version, extension);
  const previous = await db.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  if (!previous) throw notFound("Pengguna tidak ditemukan");
  await storage.save(file, `avatar.${extension}`, key);
  const image = `/api/files/avatar/${userId}?v=${version}&type=${encodeURIComponent(mimeType)}`;
  await db.user.update({ where: { id: userId }, data: { image } });
  if (previous.image?.startsWith(`/api/files/avatar/${userId}?`)) {
    const params = new URLSearchParams(previous.image.split("?")[1]);
    const previousType = params.get("type") || "image/jpeg";
    const previousExtension = avatarExtensions[previousType];
    const previousVersion = params.get("v");
    if (
      previousExtension &&
      previousVersion &&
      /^\d{10,}$/.test(previousVersion) &&
      previousVersion !== version
    ) {
      await storage.remove(avatarKey(userId, previousVersion, previousExtension));
    }
  }
  return { image };
}

export async function getAvatar(userId: string, mimeType: string, version: string) {
  const extension = avatarExtensions[mimeType];
  if (!extension || !/^\d{10,}$/.test(version)) throw notFound("Foto profil tidak ditemukan");
  try {
    return await storage.read(avatarKey(userId, version, extension));
  } catch {
    throw notFound("Foto profil tidak ditemukan");
  }
}
