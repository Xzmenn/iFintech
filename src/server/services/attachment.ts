import { randomBytes } from "node:crypto";
import path from "node:path";
import { serialize } from "@/lib/serialize";
import { notFound } from "@/server/errors";
import { db } from "@/server/db";
import { storage } from "@/server/storage";

export async function createAttachment(userId: string, transactionId: string, file: {
  buffer: Buffer; name: string; type: string;
}) {
  const transaction = await db.transaction.findFirst({ where: { id: transactionId, userId }, select: { id: true } });
  if (!transaction) throw notFound("Transaksi tidak ditemukan");
  const safeName = path.basename(file.name).replace(/[^\p{L}\p{N}._-]/gu, "_").slice(0, 120) || "lampiran";
  const cuid = `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;
  const key = `attachments/${userId}/${cuid}-${safeName}`;
  const storageKey = await storage.save(file.buffer, safeName, key);
  try {
    const attachment = await db.attachment.create({
      data: {
        userId, transactionId, fileName: safeName, mimeType: file.type,
        size: file.buffer.byteLength, storageKey,
      },
    });
    return serialize(attachment);
  } catch (error) {
    await storage.remove(storageKey);
    throw error;
  }
}

export async function getAttachment(userId: string, id: string) {
  const attachment = await db.attachment.findFirst({ where: { id, userId } });
  if (!attachment) throw notFound("Lampiran tidak ditemukan");
  return { attachment: serialize(attachment), content: await storage.read(attachment.storageKey) };
}

export async function deleteAttachment(userId: string, id: string) {
  const attachment = await db.attachment.findFirst({ where: { id, userId } });
  if (!attachment) throw notFound("Lampiran tidak ditemukan");
  await db.attachment.delete({ where: { id } });
  await storage.remove(attachment.storageKey);
  return { id };
}
