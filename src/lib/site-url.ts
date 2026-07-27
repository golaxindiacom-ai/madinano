/** Public site origin used for Open Graph, canonical URLs, and payment redirects. */
export function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  return url.replace(/\/$/, "");
}
