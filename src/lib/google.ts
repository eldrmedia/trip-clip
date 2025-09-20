import { google } from "googleapis";
import { prisma } from "./db";

export async function getGoogleOAuthForUser(userId: string) {
  const acct = await prisma.account.findFirst({ where: { userId, provider: "google" } });
  if (!acct?.access_token || !acct?.refresh_token) throw new Error("Google not connected");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT!
  );
  oauth2Client.setCredentials({
    access_token: acct.access_token!,
    refresh_token: acct.refresh_token!,
    expiry_date: acct.expires_at ? acct.expires_at * 1000 : undefined,
  });
  oauth2Client.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: { id: acct.id },
      data: {
        access_token: tokens.access_token ?? acct.access_token,
        refresh_token: tokens.refresh_token ?? acct.refresh_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : acct.expires_at,
      },
    });
  });

  return {
    oauth2Client,
    gmail: google.gmail({ version: "v1", auth: oauth2Client }),
    calendar: google.calendar({ version: "v3", auth: oauth2Client }),
    drive: google.drive({ version: "v3", auth: oauth2Client }),
  };
}
