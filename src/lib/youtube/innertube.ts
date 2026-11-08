import { Innertube } from "youtubei.js";

let clientPromise: Promise<Innertube> | null = null;

export function getInnertube() {
  if (!clientPromise) {
    clientPromise = Innertube.create({
      generate_session_locally: true,
    }).catch((error) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

export function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (typeof record.content === "string") return record.content;
  }
  return "";
}

export function absoluteUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

export function firstThumb(
  thumbnails?: Array<{ url?: string }> | { url?: string } | null,
) {
  if (!thumbnails) return "";
  if (Array.isArray(thumbnails)) {
    return absoluteUrl(thumbnails[0]?.url);
  }
  return absoluteUrl(thumbnails.url);
}

type MetadataRow = {
  metadata_parts?: Array<{ text?: unknown }>;
};

export function metadataParts(rows?: MetadataRow[] | null) {
  const parts: string[] = [];
  for (const row of rows ?? []) {
    for (const part of row.metadata_parts ?? []) {
      const value = textOf(part.text);
      if (value) parts.push(value);
    }
  }
  return parts;
}

export function pickPart(parts: string[], matcher: RegExp) {
  return parts.find((part) => matcher.test(part)) ?? "";
}

export function digitsFromCount(label?: string) {
  if (!label) return undefined;
  const cleaned = label.replace(/,/g, "").trim();
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?/i);
  if (!match) {
    const digits = cleaned.replace(/[^\d]/g, "");
    return digits || undefined;
  }
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return undefined;
  const suffix = (match[2] || "").toUpperCase();
  const mult =
    suffix === "K" ? 1_000 : suffix === "M" ? 1_000_000 : suffix === "B" ? 1_000_000_000 : 1;
  return String(Math.round(n * mult));
}
