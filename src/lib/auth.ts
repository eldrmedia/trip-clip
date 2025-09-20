// src/lib/auth.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import { prisma } from "./db";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // <-- you're on JWT now
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Scopes for profile + Gmail (readonly+modify labels), Calendar events, Drive file create/read
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.modify",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/drive.metadata.readonly",
          ].join(" "),
          access_type: "offline",   // <-- ensures refresh_token
          prompt: "consent",        // <-- forces consent screen (refresh_token first time)
        },
      },
    }),
  ],
  pages: { signIn: "/login" },

  callbacks: {
    // Put the DB user id into the token on initial sign-in
    async jwt({ token, user }) {
      if (user) {
        // 'user.id' is from Prisma after the adapter creates/fetches the user
        (token as any).uid = user.id;
      }
      return token;
    },
    // Copy the id from the token onto the session for easy server-side use
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).uid ?? token.sub ?? null;
      }
      return session;
    },
  },

  trustHost: true,
};

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
