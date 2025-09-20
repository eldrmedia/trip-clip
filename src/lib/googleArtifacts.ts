// src/lib/parsers/parseItinerary.ts
import crypto from "crypto";
// import * as ical from "ical"; // when you wire ICS parsing back in
import * as cheerio from "cheerio";

export type ParsedLeg = {
  fromCity?: string;
  toCity?: string;
  departure: Date;
  arrival: Date;
};

export type ParsedItin = {
  vendor?: string;
  confirmation?: string;
  legs: ParsedLeg[];
  hash: string;
  confidence: number;
};

// Minimal Gmail API message type (enough for our parser)
interface GmailMessagePart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMessagePart[];
}

interface GmailMessage {
  payload?: GmailMessagePart;
  [key: string]: unknown;
}

export async function parseEmail(message: GmailMessage): Promise<ParsedItin | null> {
  const { html, text } = extractBodies(message.payload);

  const jsonld = extractJsonLd(html);
  if (jsonld) return normalizeFromJsonLd(jsonld);

  // Currently no-op; signature takes no args to avoid unused warnings
  const ics = await extractIcs();
  if (ics) return normalizeFromIcs();

  const vendor = detectVendor(html, text);
  // Currently no-op; signature takes only the bodies to avoid unused vendor warnings
  const vendorParsed = vendor ? tryVendorParsers(html, text) : null;
  if (vendorParsed) return vendorParsed;

  if (!html && !text) return null;
  return genericFallback((text || html)!);
}

/* helpers */
function extractBodies(msg?: GmailMessagePart) {
  const html = part(msg, "text/html");
  const text = part(msg, "text/plain");
  return { html, text };
}

function part(node: GmailMessagePart | undefined, mime: string): string | undefined {
  if (!node) return;
  if (node.mimeType === mime && node.body?.data) {
    return Buffer.from(node.body.data, "base64").toString("utf8");
  }
  if (node.parts) {
    for (const p of node.parts) {
      const got = part(p, mime);
      if (got) return got;
    }
  }
}

function extractJsonLd(html?: string): Record<string, unknown> | null {
  if (!html) return null;
  const $ = cheerio.load(html);
  const blocks = $('script[type="application/ld+json"]');
  if (!blocks.length) return null;
  try {
    return JSON.parse(blocks.first().text()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Placeholder for ICS handling; keep no-arg signature to avoid unused warnings
async function extractIcs(): Promise<null> {
  // TODO: parse attachments with ical.parseICS
  return null;
}

function detectVendor(html?: string, text?: string): string | undefined {
  const src = (html || "") + (text || "");
  if (/Capital One/i.test(src)) return "capitalone";
  if (/Delta/i.test(src)) return "delta";
  if (/United/i.test(src)) return "united";
  if (/American Airlines|AmericanAir/i.test(src)) return "aa";
  return undefined;
}

// Placeholder for vendor-specific parsers; keep args minimal to avoid unused warnings
function tryVendorParsers(_html?: string, _text?: string): ParsedItin | null {
  return null;
}

function genericFallback(src: string): ParsedItin {
  const dep = new Date();
  const arr = new Date(dep.getTime() + 2 * 3600e3);
  const legs: ParsedLeg[] = [{ fromCity: "TBD", toCity: "TBD", departure: dep, arrival: arr }];
  const hash = crypto.createHash("sha256").update(src.slice(0, 2000)).digest("hex");
  return { vendor: "generic", confirmation: undefined, legs, hash, confidence: 0.2 };
}

function normalizeFromJsonLd(ld: Record<string, unknown>): ParsedItin {
  const dep = new Date();
  const arr = new Date(dep.getTime() + 2 * 3600e3);
  return {
    vendor: "jsonld",
    confirmation:
      typeof ld?.["reservationNumber"] === "string" ? (ld["reservationNumber"] as string) : undefined,
    legs: [{ departure: dep, arrival: arr }],
    hash: crypto.randomBytes(8).toString("hex"),
    confidence: 0.6,
  };
}

// No-arg signature to avoid unused param warnings while it’s a stub
function normalizeFromIcs(): ParsedItin {
  const dep = new Date();
  const arr = new Date(dep.getTime() + 2 * 3600e3);
  return {
    vendor: "ics",
    confirmation: undefined,
    legs: [{ departure: dep, arrival: arr }],
    hash: crypto.randomBytes(8).toString("hex"),
    confidence: 0.7,
  };
}
