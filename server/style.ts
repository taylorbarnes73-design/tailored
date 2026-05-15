import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";

export type StyleCatalogItem = {
  id: number;
  name: string;
  brand: string;
  brandId?: string;
  category: string;
  fit: number;
  risk: string;
  bestSize?: string;
  fabric?: string;
  sizingNote?: string;
  badge?: string;
  trending?: boolean;
  url?: string;
  image?: string;
  price?: number;
  color?: string;
};

export type StyleBriefRequest = {
  body: {
    bust: number;
    waist: number;
    hips: number;
    shoulder?: number;
    inseam?: number;
  };
  occasion: string;
  goal: string;
  palette: string;
  dressCode: string;
  notes?: string;
  candidates: StyleCatalogItem[];
};

export type StyleBriefResult = {
  source: "ai" | "fallback";
  shape: string;
  headline: string;
  summary: string;
  silhouettePriorities: string[];
  fabricFocus: string[];
  colorDirection: string[];
  avoid: string[];
  recommendedBrands: string[];
  recommendedItemIds: number[];
  outfitFormulas: string[];
  fitNotes: string[];
};

type ResolvedProductImage = {
  imageUrl: string | null;
  resolved: boolean;
  source: string;
};

const IMAGE_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const TEXT_TIMEOUT_MS = 8000;
const RETAIL_REQUEST_HEADERS: Record<string, string> = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  pragma: "no-cache",
  "upgrade-insecure-requests": "1",
} satisfies Record<string, string>;

const imageCache = new Map<
  string,
  { expiresAt: number; value: ResolvedProductImage }
>();
const imageInflight = new Map<string, Promise<ResolvedProductImage>>();

function inferBodyShape(body: StyleBriefRequest["body"]) {
  const bust = body?.bust || 34;
  const waist = body?.waist || 26;
  const hips = body?.hips || 36;
  const ratio = Math.max(bust, hips) / Math.max(waist, 1);

  if (ratio > 1.35) return "Hourglass";
  if (ratio > 1.2) return "Pear";
  if (bust > hips) return "Inverted Triangle";
  return "Rectangle";
}

function dedupe<T>(items: T[], getKey: (item: T) => string | number) {
  const seen = new Set<string | number>();
  return items.filter(item => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function paletteGuidance(palette: string) {
  const normalized = palette.toLowerCase();

  if (normalized.includes("neutral")) {
    return [
      "Lean on camel, ivory, espresso, and deep black to keep the wardrobe expensive and easy to mix.",
      "Use one warmer accent, like oxblood or olive, to keep the edit from reading flat.",
      "Favor tonal dressing over high-contrast color blocking.",
    ];
  }

  if (normalized.includes("soft")) {
    return [
      "Work in powder blue, blush, warm stone, and softened chocolate for a polished feminine read.",
      "Keep texture rich so softer colors still feel intentional.",
      "Pair pale shades with one grounding dark neutral each look.",
    ];
  }

  if (normalized.includes("bold")) {
    return [
      "Treat one saturated tone as the hero and let the rest of the outfit stay structured and clean.",
      "Use darker neutrals to frame strong color so the silhouette still leads.",
      "Reserve shine or metallics for accessories unless the occasion is evening-specific.",
    ];
  }

  if (normalized.includes("dark")) {
    return [
      "Anchor the wardrobe in ink, espresso, charcoal, and deep olive for a sharper city palette.",
      "Break up head-to-toe dark looks with sheen, texture, or warm metal hardware.",
      "Use bone or stone accents at the neckline to brighten the face.",
    ];
  }

  return [
    "Stay inside one disciplined palette family so the wardrobe feels collected rather than random.",
    "Use texture shifts to create interest before adding extra color.",
    "Choose accessories that repeat the dominant tone instead of competing with it.",
  ];
}

function silhouettePriorities(shape: string, goal: string, dressCode: string) {
  const normalizedGoal = goal.toLowerCase();
  const normalizedDressCode = dressCode.toLowerCase();
  const priorities: string[] = [];

  if (shape === "Hourglass") {
    priorities.push(
      "Hold onto waist definition with belting, seaming, or a neat tuck instead of hiding the midline.",
      "Choose fluid fabrics that skim rather than stiff boxy layers that interrupt your proportions.",
      "Use higher rises and clean vertical lines to keep the silhouette long."
    );
  } else if (shape === "Pear") {
    priorities.push(
      "Build visual structure at the shoulder or neckline to balance the lower half.",
      "Favor wide-leg or A-line movement below the waist so the silhouette feels intentional instead of restrictive.",
      "Keep the waist clear and elevated to maintain proportion."
    );
  } else if (shape === "Inverted Triangle") {
    priorities.push(
      "Let the lower half carry more volume than the top to balance shoulder breadth.",
      "Choose open necklines and fluid tops instead of high, rigid shoulder emphasis.",
      "Use long vertical trouser or skirt lines to calm the upper body."
    );
  } else {
    priorities.push(
      "Create definition with cinched waists, wrap lines, and pieces that shape the torso.",
      "Layer texture or subtle volume strategically so the outfit adds dimension without bulk.",
      "Use coordinated sets or tonal columns to make the silhouette feel more directional."
    );
  }

  if (
    normalizedGoal.includes("polish") ||
    normalizedDressCode.includes("tailored")
  ) {
    priorities.push(
      "Prioritize clean shoulder lines and trouser drape so the outfit reads executive, not casual."
    );
  }

  if (
    normalizedGoal.includes("evening") ||
    normalizedDressCode.includes("elevated")
  ) {
    priorities.push(
      "Keep the shape narrow and deliberate through the torso, then add softness through fabric or movement."
    );
  }

  return priorities.slice(0, 4);
}

function avoidGuidance(shape: string, candidates: StyleCatalogItem[]) {
  const highRisk = candidates
    .filter(item => item.risk.toLowerCase() === "high")
    .slice(0, 2)
    .map(item => `${item.brand} ${item.name}`);
  const notes: string[] = [];

  if (shape === "Hourglass") {
    notes.push(
      "Overly boxy layers with no waist interruption can make your best proportions disappear."
    );
  } else if (shape === "Pear") {
    notes.push(
      "Very clingy bottoms with no top structure can over-emphasize the hip line."
    );
  } else if (shape === "Inverted Triangle") {
    notes.push(
      "Sharp shoulder volume plus narrow bottoms can make the frame feel top-heavy."
    );
  } else {
    notes.push(
      "Dropped waists and shapeless straight cuts can flatten the silhouette."
    );
  }

  if (highRisk.length > 0) {
    notes.push(
      `Be cautious with ${highRisk.join(" and ")} until the fit is verified or an alteration brief is ready.`
    );
  }

  notes.push(
    "Skip low-quality stretch or limp fabrications when you want the outfit to read premium on camera and in person."
  );

  return notes.slice(0, 3);
}

function buildCategoryWeights(request: StyleBriefRequest) {
  const normalizedOccasion = request.occasion.toLowerCase();
  const normalizedGoal = request.goal.toLowerCase();
  const normalizedDressCode = request.dressCode.toLowerCase();

  const weights: Record<string, number> = {
    Tops: 0,
    Bottoms: 0,
    Dresses: 0,
    Outerwear: 0,
  };

  if (
    normalizedOccasion.includes("work") ||
    normalizedOccasion.includes("office")
  ) {
    weights.Outerwear += 12;
    weights.Bottoms += 10;
    weights.Tops += 9;
    weights.Dresses += 5;
  }

  if (
    normalizedOccasion.includes("date") ||
    normalizedOccasion.includes("dinner") ||
    normalizedOccasion.includes("event")
  ) {
    weights.Dresses += 14;
    weights.Tops += 10;
    weights.Bottoms += 7;
    weights.Outerwear += 5;
  }

  if (
    normalizedOccasion.includes("travel") ||
    normalizedOccasion.includes("weekend") ||
    normalizedOccasion.includes("day")
  ) {
    weights.Bottoms += 11;
    weights.Tops += 11;
    weights.Outerwear += 8;
    weights.Dresses += 4;
  }

  if (normalizedGoal.includes("polish")) {
    weights.Outerwear += 8;
    weights.Bottoms += 6;
  }

  if (normalizedGoal.includes("shape")) {
    weights.Dresses += 5;
    weights.Tops += 4;
  }

  if (normalizedDressCode.includes("minimal")) {
    weights.Bottoms += 4;
    weights.Tops += 4;
  }

  return weights;
}

function scoreItem(item: StyleCatalogItem, request: StyleBriefRequest) {
  const categoryWeights = buildCategoryWeights(request);
  const categoryBonus = categoryWeights[item.category] || 0;
  const lowRiskBonus =
    item.risk.toLowerCase() === "low"
      ? 12
      : item.risk.toLowerCase() === "medium"
        ? 4
        : -6;
  const trendBonus = item.trending ? 5 : 0;
  const badgeBonus = /best seller|editor|viral|pinterest|trending/i.test(
    item.badge || ""
  )
    ? 4
    : 0;

  return item.fit + categoryBonus + lowRiskBonus + trendBonus + badgeBonus;
}

function buildBrandRanking(candidates: StyleCatalogItem[]) {
  const brandMap = new Map<string, { total: number; count: number }>();
  for (const item of candidates) {
    const current = brandMap.get(item.brand) || { total: 0, count: 0 };
    current.total += item.fit;
    current.count += 1;
    brandMap.set(item.brand, current);
  }

  return Array.from(brandMap.entries())
    .map(([brand, meta]) => ({
      brand,
      avg: meta.total / Math.max(meta.count, 1),
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map(entry => entry.brand);
}

function extractFabricHighlights(candidates: StyleCatalogItem[]) {
  const seen = new Set<string>();
  const fabrics: string[] = [];

  for (const item of candidates) {
    for (const segment of (item.fabric || "").split(/[.,]/)) {
      const clean = segment.trim();
      if (!clean) continue;
      const normalized = clean.toLowerCase();
      if (normalized.length < 5) continue;
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      fabrics.push(clean);
      if (fabrics.length === 4) return fabrics;
    }
  }

  if (fabrics.length === 0) {
    return [
      "Fluid drape with enough structure to keep the line clean.",
      "Soft stretch where the body needs flexibility, especially through the waist and hip.",
      "One polished matte texture to keep the wardrobe elevated.",
    ];
  }

  return fabrics;
}

function buildOutfitFormulas(
  recommended: StyleCatalogItem[],
  request: StyleBriefRequest
) {
  const tops = recommended.filter(item => item.category === "Tops");
  const bottoms = recommended.filter(item => item.category === "Bottoms");
  const dresses = recommended.filter(item => item.category === "Dresses");
  const outerwear = recommended.filter(item => item.category === "Outerwear");
  const formulas: string[] = [];

  if (dresses[0]) {
    formulas.push(
      `${dresses[0].name} styled with refined jewelry and a clean shoe keeps the look directional without fighting your silhouette.`
    );
  }

  if (tops[0] && bottoms[0]) {
    formulas.push(
      `${tops[0].name} with ${bottoms[0].name}${outerwear[0] ? ` and ${outerwear[0].name}` : ""} gives you the strongest fit-to-polish ratio in this catalog.`
    );
  }

  formulas.push(
    `For ${request.occasion.toLowerCase()}, anchor the look in one high-fit core piece and let texture, not extra volume, do the styling work.`
  );

  return formulas.slice(0, 3);
}

function buildFitNotes(recommended: StyleCatalogItem[]) {
  const notes = recommended
    .slice(0, 4)
    .map(item => {
      const sizeNote = item.bestSize ? `Start with size ${item.bestSize}.` : "";
      const tailoring =
        item.fit < 90
          ? " Plan for a light tailoring pass if you want the finish to feel fully custom."
          : "";
      const sizing = item.sizingNote ? ` ${item.sizingNote}` : "";
      return `${item.brand} ${item.name}: ${sizeNote}${sizing}${tailoring}`.trim();
    })
    .filter(Boolean);

  return notes.length > 0
    ? notes
    : [
        "Start with the highest-fit sizes first and save tailoring for pieces that score below your best core matches.",
      ];
}

function buildFallbackBrief(request: StyleBriefRequest): StyleBriefResult {
  const shape = inferBodyShape(request.body);
  const recommended = dedupe(
    [...request.candidates].sort(
      (a, b) => scoreItem(b, request) - scoreItem(a, request)
    ),
    item => item.id
  ).slice(0, 6);
  const recommendedBrands = buildBrandRanking(
    recommended.length ? recommended : request.candidates
  );
  const colorDirection = paletteGuidance(request.palette);
  const topBrand = recommendedBrands[0];

  return {
    source: "fallback",
    shape,
    headline: `${request.goal} wardrobe brief for a ${shape.toLowerCase()} frame`,
    summary: `Your ${request.body.bust}-${request.body.waist}-${request.body.hips} profile reads as ${shape.toLowerCase()}, so the strongest direction for ${request.occasion.toLowerCase()} is controlled structure with visible shape definition. ${topBrand ? `${topBrand} is currently the cleanest brand match in this edit.` : "The current catalog still has several strong low-risk options."} Keep the silhouette disciplined, let fabric and fit do the work, and avoid adding bulk where it does not serve the line.`,
    silhouettePriorities: silhouettePriorities(
      shape,
      request.goal,
      request.dressCode
    ),
    fabricFocus: extractFabricHighlights(recommended),
    colorDirection,
    avoid: avoidGuidance(shape, request.candidates),
    recommendedBrands,
    recommendedItemIds: recommended.map(item => item.id),
    outfitFormulas: buildOutfitFormulas(recommended, request),
    fitNotes: buildFitNotes(recommended),
  };
}

function extractTextContent(content: unknown) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map(part => {
      if (typeof part === "string") return part;
      if (
        part &&
        typeof part === "object" &&
        "type" in part &&
        part.type === "text"
      ) {
        return typeof part.text === "string" ? part.text : "";
      }
      return "";
    })
    .join("\n");
}

function extractJsonBlock(text: string) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Empty LLM response");
  if (trimmed.startsWith("{")) return trimmed;

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in LLM response");
  }

  return trimmed.slice(first, last + 1);
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map(entry => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeNumberArray(value: unknown, fallback: number[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map(entry => {
      if (typeof entry === "number") return entry;
      const parsed = Number(entry);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter((entry): entry is number => entry !== null);
  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeBrief(
  raw: Record<string, unknown>,
  fallback: StyleBriefResult
): StyleBriefResult {
  return {
    source: "ai",
    shape:
      typeof raw.shape === "string" && raw.shape.trim().length > 0
        ? raw.shape.trim()
        : fallback.shape,
    headline:
      typeof raw.headline === "string" && raw.headline.trim().length > 0
        ? raw.headline.trim()
        : fallback.headline,
    summary:
      typeof raw.summary === "string" && raw.summary.trim().length > 0
        ? raw.summary.trim()
        : fallback.summary,
    silhouettePriorities: normalizeStringArray(
      raw.silhouettePriorities,
      fallback.silhouettePriorities
    ),
    fabricFocus: normalizeStringArray(raw.fabricFocus, fallback.fabricFocus),
    colorDirection: normalizeStringArray(
      raw.colorDirection,
      fallback.colorDirection
    ),
    avoid: normalizeStringArray(raw.avoid, fallback.avoid),
    recommendedBrands: normalizeStringArray(
      raw.recommendedBrands,
      fallback.recommendedBrands
    ),
    recommendedItemIds: normalizeNumberArray(
      raw.recommendedItemIds,
      fallback.recommendedItemIds
    ),
    outfitFormulas: normalizeStringArray(
      raw.outfitFormulas,
      fallback.outfitFormulas
    ),
    fitNotes: normalizeStringArray(raw.fitNotes, fallback.fitNotes),
  };
}

export async function generateStyleBrief(
  request: StyleBriefRequest
): Promise<StyleBriefResult> {
  const fallback = buildFallbackBrief(request);

  if (!ENV.forgeApiKey) {
    return fallback;
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an elite personal stylist and fit strategist. Respond with JSON only. Be specific, premium, concise, and grounded in the supplied body measurements and catalog candidates. Only recommend item IDs that appear in the provided candidates.",
        },
        {
          role: "user",
          content: JSON.stringify({
            body: request.body,
            occasion: request.occasion,
            goal: request.goal,
            palette: request.palette,
            dressCode: request.dressCode,
            notes: request.notes || "",
            fallbackSummary: fallback,
            candidates: request.candidates.map(item => ({
              id: item.id,
              name: item.name,
              brand: item.brand,
              category: item.category,
              fit: item.fit,
              risk: item.risk,
              bestSize: item.bestSize,
              fabric: item.fabric,
              sizingNote: item.sizingNote,
              badge: item.badge,
              price: item.price,
            })),
          }),
        },
      ],
      output_schema: {
        name: "style_brief",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            shape: { type: "string" },
            headline: { type: "string" },
            summary: { type: "string" },
            silhouettePriorities: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 4,
            },
            fabricFocus: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 4,
            },
            colorDirection: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 4,
            },
            avoid: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 4,
            },
            recommendedBrands: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 4,
            },
            recommendedItemIds: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
              maxItems: 6,
            },
            outfitFormulas: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 3,
            },
            fitNotes: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 4,
            },
          },
          required: [
            "shape",
            "headline",
            "summary",
            "silhouettePriorities",
            "fabricFocus",
            "colorDirection",
            "avoid",
            "recommendedBrands",
            "recommendedItemIds",
            "outfitFormulas",
            "fitNotes",
          ],
        },
      },
    });

    const message = response.choices[0]?.message;
    const rawText = extractTextContent(message?.content);
    const parsed = JSON.parse(extractJsonBlock(rawText)) as Record<
      string,
      unknown
    >;

    return normalizeBrief(parsed, fallback);
  } catch {
    return fallback;
  }
}

function isLikelyChallengePage(html: string) {
  return /just a moment|security verification|cf-browser-verification|captcha/i.test(
    html
  );
}

async function fetchText(url: string, headers = RETAIL_REQUEST_HEADERS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TEXT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers,
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      url: response.url,
      text,
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractMetaRefreshUrl(html: string, pageUrl: string) {
  const match = html.match(
    /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'>]+)/i
  );
  if (!match?.[1]) return null;

  try {
    return new URL(match[1].trim(), pageUrl).toString();
  } catch {
    return null;
  }
}

function normalizeImageUrl(rawUrl: string, pageUrl: string) {
  if (!rawUrl || rawUrl.startsWith("data:")) return null;
  const clean = rawUrl
    .replace(/&amp;/g, "&")
    .replace(/^\/\//, "https://")
    .trim();

  try {
    const absolute = new URL(clean, pageUrl).toString();
    if (!/^https?:/i.test(absolute)) return null;
    if (/\.svg(\?|$)/i.test(absolute)) return null;
    const pageAbsolute = new URL(pageUrl).toString();
    if (absolute === pageAbsolute) return null;
    if (
      /(bat\.bing\.com|doubleclick|google-analytics|facebook\.com\/tr|analytics|\/collect(?:\/|\?|$)|\/akam\/|pixel[_/-]|action\/0\?)/i.test(
        absolute
      )
    ) {
      return null;
    }
    return absolute;
  } catch {
    return null;
  }
}

function extractAttr(tag: string, attribute: string) {
  const pattern = new RegExp(`${attribute}=["']([^"']+)["']`, "i");
  return tag.match(pattern)?.[1] || "";
}

function pickFromSrcset(srcset: string) {
  if (!srcset) return "";
  const parts = srcset
    .split(",")
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => part.split(/\s+/)[0])
    .filter(Boolean);
  return parts[parts.length - 1] || "";
}

function getBaseDomain(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    return parts.slice(-2).join(".");
  } catch {
    return "";
  }
}

function scoreImageCandidate(
  candidateUrl: string,
  alt: string,
  name: string,
  brand: string,
  pageUrl: string
) {
  const haystack = `${candidateUrl} ${alt}`.toLowerCase();
  const keywords = `${name} ${brand}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(token => token.length > 2);

  let score = 0;
  const pageDomain = getBaseDomain(pageUrl);
  const candidateDomain = getBaseDomain(candidateUrl);

  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += 28;
  }

  if (pageDomain && candidateDomain && pageDomain === candidateDomain) {
    score += 42;
  } else if (
    /cdn|cloudfront|imgix|shopify|images|media|static/.test(haystack)
  ) {
    score += 18;
  } else {
    score -= 18;
  }

  if (/og:image|twitter:image/.test(alt)) score += 80;
  if (
    /product|products|prd|catalog|detail|lookbook|image\/upload/.test(haystack)
  ) {
    score += 50;
  }
  if (/w_800|w=800|width=800|width=1200|1200x|1600x/.test(haystack)) {
    score += 25;
  }
  if (/logo|icon|sprite|placeholder|favicon|avatar|thumb/.test(haystack)) {
    score -= 80;
  }
  if (
    /model|dress|pant|blouse|coat|jean|bodysuit|skirt|trouser/.test(haystack)
  ) {
    score += 14;
  }

  return score;
}

function collectHtmlImageCandidates(
  html: string,
  pageUrl: string,
  name: string,
  brand: string
) {
  const candidates: Array<{ url: string; score: number }> = [];
  const pushCandidate = (rawUrl: string, alt = "") => {
    const normalized = normalizeImageUrl(rawUrl, pageUrl);
    if (!normalized) return;
    candidates.push({
      url: normalized,
      score: scoreImageCandidate(normalized, alt, name, brand, pageUrl),
    });
  };

  const metaPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/gi,
  ];

  for (const pattern of metaPatterns) {
    for (const match of Array.from(html.matchAll(pattern))) {
      pushCandidate(
        match[1],
        pattern.source.includes("og:image") ? "og:image" : "meta"
      );
    }
  }

  for (const match of Array.from(html.matchAll(/"image"\s*:\s*"([^"]+)"/gi))) {
    pushCandidate(match[1], "jsonld");
  }

  const imgTags = html.match(/<img[\s\S]*?>/gi) || [];
  for (const tag of imgTags) {
    const src =
      extractAttr(tag, "src") ||
      extractAttr(tag, "data-src") ||
      pickFromSrcset(extractAttr(tag, "srcset")) ||
      pickFromSrcset(extractAttr(tag, "data-srcset"));
    if (!src) continue;
    const alt = extractAttr(tag, "alt");
    pushCandidate(src, alt);
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function extractPreferredMetaImage(html: string, pageUrl: string) {
  const metaPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i,
  ];

  for (const pattern of metaPatterns) {
    const raw = html.match(pattern)?.[1];
    const normalized = raw ? normalizeImageUrl(raw, pageUrl) : null;
    if (normalized) return normalized;
  }

  return null;
}

function collectMarkdownImageCandidates(
  markdown: string,
  pageUrl: string,
  name: string,
  brand: string
) {
  const candidates: Array<{ url: string; score: number }> = [];
  const pushCandidate = (rawUrl: string, alt = "") => {
    const normalized = normalizeImageUrl(rawUrl, pageUrl);
    if (!normalized) return;
    candidates.push({
      url: normalized,
      score: scoreImageCandidate(normalized, alt, name, brand, pageUrl),
    });
  };

  for (const match of Array.from(
    markdown.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi)
  )) {
    pushCandidate(match[2], match[1]);
  }

  return candidates.sort((a, b) => b.score - a.score);
}

async function extractFromDirectPage(
  url: string,
  name: string,
  brand: string
): Promise<ResolvedProductImage | null> {
  const response = await fetchText(url);
  const refreshUrl = extractMetaRefreshUrl(response.text, response.url);

  if (refreshUrl && refreshUrl !== response.url) {
    const refreshed = await fetchText(refreshUrl);
    const preferredMeta = extractPreferredMetaImage(
      refreshed.text,
      refreshed.url
    );
    if (preferredMeta) {
      return {
        imageUrl: preferredMeta,
        resolved: true,
        source: refreshed.ok ? "direct" : `direct-${refreshed.status}`,
      };
    }
    const candidates = collectHtmlImageCandidates(
      refreshed.text,
      refreshed.url,
      name,
      brand
    );
    if (candidates[0]) {
      return {
        imageUrl: candidates[0].url,
        resolved: true,
        source: refreshed.ok ? "direct" : `direct-${refreshed.status}`,
      };
    }
  }

  if (isLikelyChallengePage(response.text)) {
    return null;
  }

  const preferredMeta = extractPreferredMetaImage(response.text, response.url);
  if (preferredMeta) {
    return {
      imageUrl: preferredMeta,
      resolved: true,
      source: response.ok ? "direct" : `direct-${response.status}`,
    };
  }

  const candidates = collectHtmlImageCandidates(
    response.text,
    response.url,
    name,
    brand
  );
  if (!candidates[0]) return null;

  return {
    imageUrl: candidates[0].url,
    resolved: true,
    source: response.ok ? "direct" : `direct-${response.status}`,
  };
}

async function extractFromMirror(
  url: string,
  name: string,
  brand: string
): Promise<ResolvedProductImage | null> {
  const mirrorUrl = `https://r.jina.ai/http://${url}`;
  const response = await fetchText(mirrorUrl, {
    "user-agent": RETAIL_REQUEST_HEADERS["user-agent"],
  });
  const candidates = collectMarkdownImageCandidates(
    response.text,
    url,
    name,
    brand
  );

  if (!candidates[0]) return null;

  return {
    imageUrl: candidates[0].url,
    resolved: true,
    source: "mirror",
  };
}

export async function resolveRetailerImage(params: {
  url?: string;
  name?: string;
  brand?: string;
}): Promise<ResolvedProductImage> {
  const url = params.url?.trim();
  if (!url) {
    return { imageUrl: null, resolved: false, source: "missing-url" };
  }

  const cached = imageCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const inflight = imageInflight.get(url);
  if (inflight) {
    return inflight;
  }

  const resolutionPromise = (async () => {
    try {
      const direct = await extractFromDirectPage(
        url,
        params.name || "",
        params.brand || ""
      );
      if (direct?.imageUrl) {
        return direct;
      }

      const mirrored = await extractFromMirror(
        url,
        params.name || "",
        params.brand || ""
      );
      if (mirrored?.imageUrl) {
        return mirrored;
      }
    } catch {
      return { imageUrl: null, resolved: false, source: "error" };
    }

    return { imageUrl: null, resolved: false, source: "fallback" };
  })();

  imageInflight.set(url, resolutionPromise);

  try {
    const value = await resolutionPromise;
    imageCache.set(url, {
      value,
      expiresAt: Date.now() + IMAGE_CACHE_TTL_MS,
    });
    return value;
  } finally {
    imageInflight.delete(url);
  }
}
