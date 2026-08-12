import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ScrapedMeta = {
  title: string;
  description: string;
  image: string | null;
  logo: string | null;
  siteName: string;
  domain: string;
  themeColor: string | null;
};

const PRIVATE_HOST =
  /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|\[?::1\]?|172\.(1[6-9]|2\d|3[01])\.|.*\.local)/i;

export function isLocalUrl(raw: string): boolean {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return PRIVATE_HOST.test(u.hostname);
  } catch {
    return false;
  }
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[2] ?? m[3] ?? null) : null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseMeta(html: string, pageUrl: string): ScrapedMeta {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const meta = new Map<string, string>();
  for (const tag of tags) {
    const key = (attr(tag, "property") ?? attr(tag, "name"))?.toLowerCase();
    const content = attr(tag, "content");
    if (key && content) meta.set(key, decode(content));
  }
  const abs = (v: string | null | undefined) => {
    if (!v) return null;
    try {
      return new URL(v, pageUrl).toString();
    } catch {
      return null;
    }
  };
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const iconTag = (html.match(/<link\b[^>]*>/gi) ?? []).find((t) =>
    /rel\s*=\s*["'][^"']*icon/i.test(t),
  );
  const host = (() => {
    try {
      return new URL(pageUrl).host;
    } catch {
      return pageUrl;
    }
  })();

  return {
    title:
      meta.get("og:title") ??
      meta.get("twitter:title") ??
      (titleTag ? decode(titleTag) : "") ??
      (h1 ? decode(h1.replace(/<[^>]+>/g, "")) : ""),
    description:
      meta.get("og:description") ??
      meta.get("twitter:description") ??
      meta.get("description") ??
      "",
    image: abs(meta.get("og:image") ?? meta.get("twitter:image")),
    logo: abs(iconTag ? attr(iconTag, "href") : `/favicon.ico`),
    siteName: meta.get("og:site_name") ?? host,
    domain: host.replace(/^www\./, ""),
    themeColor: meta.get("theme-color") ?? null,
  };
}

export const scrapeUrl = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ url: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<ScrapedMeta> => {
    const raw = data.url.trim();
    const url = raw.startsWith("http") ? raw : `https://${raw}`;
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only http and https URLs are supported.");
    }
    if (PRIVATE_HOST.test(parsed.hostname)) {
      throw new Error("LOCAL_URL");
    }
    const res = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OGStudioBot/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Site responded with ${res.status}`);
    const html = (await res.text()).slice(0, 500_000);
    return parseMeta(html, res.url || parsed.toString());
  });