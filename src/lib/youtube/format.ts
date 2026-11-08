export function formatCount(value?: string | number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string" && /[a-z]/i.test(value) && !/^\d/.test(value.trim())) {
    return value;
  }
  const n =
    typeof value === "string"
      ? Number(value.replace(/,/g, "").replace(/[^\d.]/g, ""))
      : value;
  if (!Number.isFinite(n)) {
    return typeof value === "string" ? value : null;
  }
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatViews(value?: string | number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string" && /view|watching/i.test(value)) return value;
  const formatted = formatCount(value);
  return formatted ? `${formatted} views` : null;
}

export function formatSubscribers(value?: string | number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string" && /subscriber/i.test(value)) return value;
  const formatted = formatCount(value);
  return formatted ? `${formatted} subscribers` : null;
}

export function formatPublished(value?: string) {
  if (!value) return null;
  if (/ago|streamed|premiered|hour|day|week|month|year|yesterday|today/i.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    "day",
  );
}

export function formatDuration(value?: string) {
  if (!value) return null;
  if (/^\d+:\d{2}/.test(value)) return value;
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return value;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
