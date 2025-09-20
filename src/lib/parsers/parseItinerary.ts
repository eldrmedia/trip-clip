import crypto from "crypto";
import * as ical from "ical";
import * as cheerio from "cheerio";

export type ParsedLeg = { fromCity?: string; toCity?: string; departure: Date; arrival: Date; };
export type ParsedItin = { vendor?: string; confirmation?: string; legs: ParsedLeg[]; hash: string; confidence: number; };

export async function parseEmail(message: any): Promise<ParsedItin | null> {
  const { html, text } = extractBodies(message);
  const jsonld = extractJsonLd(html);
  if (jsonld) return normalizeFromJsonLd(jsonld);

  const ics = await extractIcs(message);
  if (ics) return normalizeFromIcs(ics);

  const vendor = detectVendor(html, text);
  const vendorParsed = vendor ? tryVendorParsers(vendor, html, text) : null;
  if (vendorParsed) return vendorParsed;

  if (!html && !text) return null;
  return genericFallback((text || html)!);
}

/* helpers (abbreviated; safe fallbacks) */
function extractBodies(msg:any){ const html = part(msg,"text/html"); const text = part(msg,"text/plain"); return { html, text }; }
function part(node:any, mime:string):string|undefined{
  if (!node) return;
  if (node.mimeType === mime && node.body?.data) return Buffer.from(node.body.data,"base64").toString("utf8");
  if (node.parts) for (const p of node.parts) { const got = part(p, mime); if (got) return got; }
}
function extractJsonLd(html?:string){ if(!html) return null; const $ = cheerio.load(html); const blocks = $('script[type="application/ld+json"]'); if (!blocks.length) return null; try { return JSON.parse(blocks.first().text()); } catch { return null; } }
async function extractIcs(message:any){ /* optionally fetch attachments and parse with ical.parseICS */ return null; }
function detectVendor(html?:string, text?:string){ const src = (html||"")+(text||""); if (/Capital One/i.test(src)) return "capitalone"; if (/Delta/i.test(src)) return "delta"; if (/United/i.test(src)) return "united"; if (/American Airlines|AmericanAir/i.test(src)) return "aa"; return undefined; }
function tryVendorParsers(_vendor:string,_html?:string,_text?:string){ return null; }

function genericFallback(src:string):ParsedItin{
  const dep = new Date(); const arr = new Date(dep.getTime()+2*3600e3);
  const legs = [{ fromCity: "TBD", toCity: "TBD", departure: dep, arrival: arr }];
  const hash = crypto.createHash("sha256").update(src.slice(0,2000)).digest("hex");
  return { vendor:"generic", confirmation: undefined, legs, hash, confidence: 0.2 };
}
function normalizeFromJsonLd(ld:any):ParsedItin{
  // map minimal fields if present
  const dep = new Date(); const arr = new Date(dep.getTime()+2*3600e3);
  return { vendor:"jsonld", confirmation: ld?.reservationNumber, legs:[{departure:dep, arrival:arr}], hash: crypto.randomBytes(8).toString("hex"), confidence: 0.6 };
}
function normalizeFromIcs(_ics:any):ParsedItin{
  const dep = new Date(); const arr = new Date(dep.getTime()+2*3600e3);
  return { vendor:"ics", confirmation: undefined, legs:[{departure:dep, arrival:arr}], hash: crypto.randomBytes(8).toString("hex"), confidence: 0.7 };
}
