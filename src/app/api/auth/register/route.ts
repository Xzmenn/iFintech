import { NextResponse, type NextRequest } from "next/server";
import { withApi } from "@/server/api-handler";
import { createUser } from "@/server/services/user";
import { registerSchema } from "@/lib/validations/auth";

export const POST = withApi(async (request: NextRequest) => {
  const input = registerSchema.parse(await request.json());
  const user = await createUser(input);
  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email },
    { status: 201 },
  );
});
