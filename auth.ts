import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import type { User } from "@/app/lib/definitions";
import bcryptjs from "bcryptjs";
import postgres from "postgres";
import { resendEmailProvider } from "./app/lib/auth/resendEmailProvider";


const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });


// Funciones de ayuda
async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0];
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

async function createGoogleUser({
  email,
  name,
  image_url,
  google_id,
}: {
  email: string;
  name: string;
  image_url: string | null;
  google_id: string;
}): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`
      INSERT INTO users (email, name, image_url, google_id)
      VALUES (${email}, ${name}, ${image_url}, ${google_id})
      RETURNING *;
    `;
    return user[0];
  } catch (error) {
    console.error("Failed to create Google user:", error);
    return undefined;
  }
}

async function linkGoogleToUser(
  userId: string,
  googleId: string,
  name: string,
  image: string | null
): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`
      UPDATE users
      SET google_id = ${googleId}, name = ${name}, image_url = ${image}
      WHERE id = ${userId}
      RETURNING *;
    `;
    return user[0];
  } catch (error) {
    console.error("Failed to link Google account:", error);
    return undefined;
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email!;
        const name = user.name || "Usuario Google";
        const image = user.image || null;
        const googleId = email;

        const existingUser = await getUser(email);

        if (!existingUser) {
          await createGoogleUser({
            email,
            name,
            image_url: image,
            google_id: googleId,
          });
        } else if (!existingUser.google_id) {
          await linkGoogleToUser(existingUser.id, googleId, name, image);
        }
      }

      return true;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user || !user.password) return null;
          const passwordsMatch = await bcryptjs.compare(
            password,
            user.password
          );
          if (passwordsMatch) return user;
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    // resendEmailProvider(),
  ],
});
