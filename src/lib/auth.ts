// src/lib/auth.ts
import "server-only";

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import { prisma } from "./db";

import type { Session, User, Account, Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";

function scopesToFlags(scopeStr: string | null | undefined) {
  const scopes = (scopeStr ?? "").split(/\s+/);
  const gmail = scopes.some((s) => s.startsWith("https://www.googleapis.com/auth/gmail"));
  const calendar =
    scopes.includes("https://www.googleapis.com/auth/calendar") ||
    scopes.includes("https://www.googleapis.com/auth/calendar.events");
  const drive = scopes.includes("https://www.googleapis.com/auth/drive.file");
  return { gmail, calendar, drive };
}

// NOTE: no `as const` anywhere — keep providers mutable for NextAuth types
export const authConfig = {
  adapter: PrismaAdapter(prisma),

session: { strategy: "jwt" as const },

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
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    }),
  ],

  pages: { signIn: "/login" },

  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT & { id?: string };
      user?: User | null;
      account?: Account | null;
      profile?: Profile | null;
      trigger?: string;
      session?: Session;
      isNewUser?: boolean;
    }) {
      if (user && typeof (user as { id?: unknown }).id === "string") {
        token.id = (user as { id: string }).id;
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & { id?: string };
      user?: User | null;
    }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },

  events: {
    async linkAccount({ user, account }: { user: User; account?: Account | null }) {
      if (account?.provider !== "google") return;
      const { gmail, calendar, drive } = scopesToFlags(account.scope as string | undefined);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleGmailConnected: gmail,
          googleCalendarConnected: calendar,
          googleDriveConnected: drive,
        },
      });
    },

    async signIn({ user, account }: { user: User; account?: Account | null }) {
      if (account?.provider !== "google") return;
      const { gmail, calendar, drive } = scopesToFlags(account.scope as string | undefined);
      if (gmail || calendar || drive) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            googleGmailConnected: gmail,
            googleCalendarConnected: calendar,
            googleDriveConnected: drive,
          },
        });
      }
    },
  },

  trustHost: true,
};

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
