import { serialize } from "@/lib/serialize";
import { settingsUpdateSchema } from "@/lib/validations/settings";
import { db } from "@/server/db";

export async function getSettings(userId: string) {
  return serialize(
    await db.setting.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
  );
}

export async function updateSettings(userId: string, input: unknown) {
  const data = settingsUpdateSchema.parse(input);
  return serialize(
    await db.setting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    }),
  );
}
