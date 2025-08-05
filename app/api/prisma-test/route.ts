// app/api/prisma-test/route.ts
import { prisma } from '../../lib/prisma'

export async function POST() {
  const newUser = await prisma.user.create({
    data: {  email: "algo@ejemplo.com",
    name: "Juan",
    password: "hashed_password",
    provider: "credentials" // o "google", o lo que uses
    },
  });

  return Response.json(newUser);
}
