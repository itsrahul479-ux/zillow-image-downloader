import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── Helper functions ─────────────────────────────────────────────────────────

function parseZillowImageDimensions(url: string) {
  const withinMatch = url.match(/within_(\d+)_(\d+)/);
  if (withinMatch) {
    return { width: parseInt(withinMatch[1], 10), height: parseInt(withinMatch[2], 10) };
  }
  if (url.includes("-o_a.")) return { width: 1024, height: 768 };
  if (url.includes("-d_d.")) return { width: 800, height: 600 };
  return { width: 1536, height: 1152 };
}

function convertToHighRes(url: string): string {
  if (url.includes("photos.zillowstatic.com/fp/")) {
    const hashMatch = url.match(/\/fp\/([a-fA-F0-9]{32})/);
    if (hashMatch) {
      const hash = hashMatch[1];
      const extMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      const ext = extMatch ? extMatch[1] : "jpg";
      return `https://photos.zillowstatic.com/fp/${hash}-uncropped_scaled_within_1536_1152.${ext}`;
    }
  }
  return url;
}

function getImageHash(url: string): string | null {
  const match = url.match(/\/fp\/([a-fA-F0-9]{32})/);
  if (match) return match[1];
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    const baseName = lastPart.split(".")[0];
    const hash = baseName.split("-")[0].split("_")[0];
    if (hash && hash.length >= 10) return hash;
  }
  return null;
}

function deduplicateZillowImages(urls: string[]): string[] {
  const groups: Record<string, { url: string; area: number }> = {};
  const ungrouped: string[] = [];
  for (const url of urls) {
    const hash = getImageHash(url);
    if (!hash) { ungrouped.push(url); continue; }
    const dims = parseZillowImageDimensions(url);
    const area = dims.width * dims.height;
    if (!groups[hash] || area > groups[hash].area) {
      groups[hash] = { url, area };
    }
  }
  const groupedUrls = Object.values(groups).map(g => g.url);
  return Array.from(new Set([...groupedUrls, ...ungrouped]));
}

function getAddressFromUrl(zillowUrl: string): string {
  let address = "Zillow Property";
  try {
    const urlObj = new URL(zillowUrl);
    const pathname = urlObj.pathname;
    const homedetailIndex = pathname.indexOf("/homedetails/");
    if (homedetailIndex !== -1) {
      const pathAfter = pathname.substring(homedetailIndex + 13);
      const segments = pathAfter.split("/").filter(s => s.length > 0);
      if (segments.length > 0) {
        const addressSlug = segments[0].replace(/-\d+_zpid$/, "").replace(/_/g, " ");
        address = addressSlug
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }
  } catch {}
  return address;
}

async function scrapeZillowImages(zillowUrl: string) {
  const response = await fetch(zillowUrl, {
    signal: AbortSignal.timeout(10000),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
    }
  });

  if (!response.ok) throw new Error(`Zillow returned status: ${response.status}`);

  const html = await response.text();
  let imageUrls: string[] = [];
  let pageTitle = "";

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  if (titleMatch?.[1]) pageTitle = titleMatch[1].trim();

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextDataMatch?.[1]) {
    const jsonData = JSON.parse(nextDataMatch[1]);
    const searchForUrls = (obj: any) => {
      if (!obj) return;
      if (typeof obj === "string") {
        if (obj.includes("photos.zillowstatic.com") && (obj.endsWith(".jpg") || obj.endsWith(".webp") || obj.includes("/fp/"))) {
          imageUrls.push(obj);
        }
      } else if (Array.isArray(obj)) {
        for (const item of obj) searchForUrls(item);
      } else if (typeof obj === "object") {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) searchForUrls(obj[key]);
        }
      }
    };
    searchForUrls(jsonData);
  }

  const staticPhotoRegex = /https:\/\/photos\.zillowstatic\.com\/[a-zA-Z0-9_\-\/]+\.(?:webp|jpg|jpeg|png)/g;
  const matches = html.match(staticPhotoRegex);
  if (matches) imageUrls.push(...matches);

  imageUrls = imageUrls.map(url => convertToHighRes(url.replace(/\\u002F/g, "/").replace(/\\/g, "")));
  return { urls: deduplicateZillowImages(imageUrls), title: pageTitle };
}

// ── Vercel Handler ────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string") {
    return res.status(400).json({ success: false, error: "URL is required and must be a string." });
  }

  const sanitizedUrl = url.trim();
  const isZillow = sanitizedUrl.startsWith("https://www.zillow.com/") || sanitizedUrl.startsWith("https://zillow.com/");

  if (!isZillow) {
    return res.status(400).json({
      success: false,
      error: "Invalid URL. Please enter a valid Zillow URL starting with https://www.zillow.com/"
    });
  }

  try {
    const scrapeResult = await scrapeZillowImages(sanitizedUrl);

    if (scrapeResult.urls.length > 0) {
      const imagesList = scrapeResult.urls.map((imageUrl, idx) => {
        const paddedIdx = String(idx + 1).padStart(2, "0");
        const dims = parseZillowImageDimensions(imageUrl);
        return { url: imageUrl, filename: `zillow_image_${paddedIdx}.jpg`, width: dims.width, height: dims.height };
      });
      const parsedTitle = scrapeResult.title ? scrapeResult.title.replace(" | Zillow", "") : getAddressFromUrl(sanitizedUrl);
      return res.status(200).json({ success: true, address: parsedTitle, images: imagesList, isDemoMode: false });
    }

    // 0 images → demo fallback
    return res.status(200).json({
      success: true,
      address: getAddressFromUrl(sanitizedUrl),
      images: [],
      isDemoMode: true,
      message: "Zillow's anti-scraping protection blocked this request. Try again or use a different listing URL."
    });

  } catch (error: any) {
    return res.status(200).json({
      success: true,
      address: getAddressFromUrl(sanitizedUrl),
      images: [],
      isDemoMode: true,
      message: `Connection error: ${error.message}`
    });
  }
}
