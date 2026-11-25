/* ================================================================
   Lightweight HTML sanitizer for CMS page content.

   Zero dependencies. Strategy:
     1. Drop dangerous block tags together with their inner content.
     2. Drop void/dangerous tags and HTML comments.
     3. Drop event-handler attributes and unsafe URL schemes.
     4. Rebuild the remaining tags from an allowlist, discarding
        every attribute except safe href/title on anchors.

   The editor only emits simple formatting markup, so an allowlist
   keeps stored content predictable without a full HTML parser.
   ================================================================ */

const DANGEROUS_BLOCKS =
  /<(script|iframe|object|embed|style|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_TAGS =
  /<(script|iframe|object|embed|style|form|meta|link|base)\b[^>]*\/?>/gi;
const EVENT_HANDLER_ATTR =
  /\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const HTML_TOKEN = /<[^>]*>/g;
const TAG_TOKEN = /^<\s*(\/?)\s*([a-zA-Z][\w-]*)\b([\s\S]*?)\/?\s*>$/;
const ATTRIBUTE =
  /\s([a-zA-Z_:][\w:.-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;

const ALLOWED_TAGS = new Set([
  "h2",
  "h3",
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "hr",
  "span",
  "div",
]);

const VOID_TAGS = new Set(["br", "hr"]);

function safeCodePoint(value: number): string {
  try {
    return String.fromCodePoint(value);
  } catch {
    return "";
  }
}

/** Decode the common entity/whitespace tricks used to hide URL schemes. */
function decodeForSchemeCheck(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_match, hex: string) =>
      safeCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);?/g, (_match, decimal: string) =>
      safeCodePoint(Number(decimal)),
    )
    .replace(/&(?:colon|sol|tab|newline|null);/gi, "")
    .replace(/[\u0000-\u0020\u007f]/g, "")
    .toLowerCase();
}

function isUnsafeUrl(value: string | undefined): boolean {
  if (!value) return false;
  const decoded = decodeForSchemeCheck(value);
  return (
    /^(?:javascript|vbscript|data):/.test(decoded) ||
    decoded.startsWith("//javascript:") ||
    decoded.startsWith("//vbscript:")
  );
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Rebuild an allowlisted opening tag with only safe attributes. */
function rebuildTag(name: string, rawAttributes: string): string {
  if (name !== "a") return `<${name}${VOID_TAGS.has(name) ? " /" : ""}>`;

  const attributes: string[] = [];
  for (const match of rawAttributes.matchAll(ATTRIBUTE)) {
    const key = match[1]?.toLowerCase() ?? "";
    const value = match[2] ?? match[3] ?? match[4];
    if (value === undefined) continue;

    if (key === "href") {
      if (!isUnsafeUrl(value)) attributes.push(`href="${escapeAttribute(value)}"`);
    } else if (key === "title") {
      attributes.push(`title="${escapeAttribute(value)}"`);
    }
  }

  return `<a${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}>`;
}

/**
 * Sanitize rich-text HTML before storing it or serving it to the storefront.
 * Always returns a string (non-string input becomes "").
 */
export function sanitizeHtml(value: unknown): string {
  if (typeof value !== "string" || value === "") return "";

  let html = value.replace(/<!--[\s\S]*?-->/g, "");

  // Repeat to catch nested dangerous blocks (e.g. a form wrapping a script).
  for (let pass = 0; pass < 10; pass += 1) {
    const next = html.replace(DANGEROUS_BLOCKS, "");
    if (next === html) break;
    html = next;
  }

  html = html
    .replace(DANGEROUS_TAGS, "")
    .replace(EVENT_HANDLER_ATTR, "");

  return html.replace(HTML_TOKEN, (token) => {
    const parsed = TAG_TOKEN.exec(token);
    if (!parsed) return "";

    const closingSlash = parsed[1];
    const rawName = parsed[2] ?? "";
    const rawAttributes = parsed[3] ?? "";
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (closingSlash) return `</${name}>`;
    return rebuildTag(name, rawAttributes);
  });
}
