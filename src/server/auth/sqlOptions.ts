import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/env/server.mjs";
import { createSecureEmailProvider } from "@/server/auth/secureEmailProvider";
import { prisma } from "@/server/db/client";

export const authOptions: NextAuthOptions = {
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        const adminRole = await prisma.userRole.findFirst({
          where: {
            userId: user.id,
            role: {
              admin: true,
            },
          },
        });

        session.user.role = adminRole ? "admin" : "user";
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    createSecureEmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port:
          process.env.EMAIL_SERVER_PORT === undefined
            ? undefined
            : Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: env.EMAIL_FROM,
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
};
