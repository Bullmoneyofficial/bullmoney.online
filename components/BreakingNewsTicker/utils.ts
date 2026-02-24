/**
 * Decode HTML entities and normalize whitespace.
 * Handles &amp;, &lt;, &gt;, &quot;, &nbsp;, &#39;, &#xNN;, &#NNN; etc.
 */
export function decodeText(input: string): string {
  return (input || "")
    // decode &amp; first so &amp;#39; becomes &#39;
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;|&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m, dec) => {
      const codePoint = Number.parseInt(String(dec), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      const codePoint = Number.parseInt(String(hex), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Human-readable relative time string from an ISO date.
 * Returns "Just now", "Xm ago", "Xh ago", or "Xd ago".
 */
export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
