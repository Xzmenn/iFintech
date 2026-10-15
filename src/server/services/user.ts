import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export async function createUser(input: CreateUserInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const email = input.email.trim().toLowerCase();

  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name.trim(), email, passwordHash },
    });

    await tx.setting.create({ data: { userId: user.id } });
    for (const category of DEFAULT_CATEGORIES) {
      await tx.category.create({
        data: {
          userId: user.id,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          isDefault: true,
          ...("subCategories" in category && category.subCategories.length > 0
            ? {
                subCategories: {
                  create: category.subCategories.map((name) => ({ name })),
                },
              }
            : {}),
        },
      });
    }
    return user;
  });
}
