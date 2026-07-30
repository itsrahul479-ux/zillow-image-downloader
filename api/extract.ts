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
  if (url.includes("rdcpix.com")) {
    let highRes = url;
    highRes = highRes.replace(/-w\d+_h\d+(_q\d+)?/g, "-w2048_h1536_q80");
    highRes = highRes.replace(/s\.jpg$/i, "o.jpg");
    return highRes;
  }
  return url;
}

function getImageHash(url: string): string | null {
  if (url.includes("rdcpix.com")) {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    if (filename) {
      const baseHash = filename.split("-")[0].split(".")[0];
      if (baseHash && baseHash.length >= 8) return baseHash;
    }
  }
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

function deduplicateRealtorImages(urls: string[]): string[] {
  const seenHashes = new Set<string>();
  const uniqueUrls: string[] = [];
  for (const url of urls) {
    const hash = getImageHash(url);
    if (hash) {
      if (!seenHashes.has(hash)) {
        seenHashes.add(hash);
        uniqueUrls.push(url);
      }
    } else if (!uniqueUrls.includes(url)) {
      uniqueUrls.push(url);
    }
  }
  return uniqueUrls;
}

function isZillowUrl(url: string): boolean {
  return url.includes("zillow.com");
}

function isRealtorUrl(url: string): boolean {
  return url.includes("realtor.com");
}

function extractRealtorAddress(realtorUrl: string): string {
  try {
    const urlObj = new URL(realtorUrl);
    const pathname = urlObj.pathname;
    const detailIndex = pathname.indexOf("/realestateandhomes-detail/");
    if (detailIndex !== -1) {
      const slug = pathname.substring(detailIndex + 27).split("/")[0];
      if (slug) {
        const cleanSlug = slug.replace(/_M[a-zA-Z0-9-]+$/, "");
        const parts = cleanSlug.split("_");
        const formattedParts = parts.map(part =>
          part
            .split("-")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        );
        return formattedParts.join(", ");
      }
    }
  } catch (e) {}
  return "Realtor Property";
}

function getAddressFromUrl(listingUrl: string): string {
  if (isRealtorUrl(listingUrl)) {
    return extractRealtorAddress(listingUrl);
  }
  let address = "Zillow Property";
  try {
    const urlObj = new URL(listingUrl);
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

function extractZpid(zillowUrl: string): string | null {
  const match = zillowUrl.match(/\/(\d+)_zpid/);
  return match ? match[1] : null;
}

async function scrapeRealtorImages(realtorUrl: string) {
  const cleanUrl = realtorUrl.split("?")[0];
  const response = await fetch(cleanUrl, {
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Referer": "https://www.realtor.com/",
    }
  });

  if (!response.ok) {
    throw new Error(`Realtor returned status: ${response.status}`);
  }

  const html = await response.text();
  let imageUrls: string[] = [];
  let pageTitle = "";

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  if (titleMatch?.[1]) pageTitle = titleMatch[1].trim();

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextDataMatch?.[1]) {
    try {
      const jsonData = JSON.parse(nextDataMatch[1]);
      const searchForUrls = (obj: any) => {
        if (!obj) return;
        if (typeof obj === "string") {
          if (obj.includes("rdcpix.com") &&
              (obj.endsWith(".jpg") || obj.endsWith(".webp") || obj.endsWith(".jpeg") || obj.includes("-w") || obj.includes("-m"))) {
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
    } catch {}
  }

  const realtorPhotoRegex = /https:\/\/(?:[a-zA-Z0-9_-]+\.)?rdcpix\.com\/[a-zA-Z0-9_\-\/]+\.(?:webp|jpg|jpeg|png)(?:\?[^"'\s>\\]+)?/g;
  const matches = html.match(realtorPhotoRegex);
  if (matches) imageUrls.push(...matches);

  imageUrls = imageUrls.map(url =>
    convertToHighRes(url.replace(/\\u002F/g, "/").replace(/\\/g, "").replace(/\\n/g, ""))
  );

  return { urls: deduplicateRealtorImages(imageUrls), title: pageTitle };
}

async function scrapeZillowImages(zillowUrl: string) {
  const zpid = extractZpid(zillowUrl);
  const cleanUrl = zpid
    ? `https://www.zillow.com/homedetails/${zpid}_zpid/`
    : zillowUrl.split("?")[0];

  const response = await fetch(cleanUrl, {
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Referer": "https://www.google.com/search?q=zillow+homes",
    }
  });

  if (!response.ok) {
    throw new Error(`Zillow returned status: ${response.status}`);
  }

  const html = await response.text();
  let imageUrls: string[] = [];
  let pageTitle = "";

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  if (titleMatch?.[1]) pageTitle = titleMatch[1].trim();

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextDataMatch?.[1]) {
    try {
      const jsonData = JSON.parse(nextDataMatch[1]);
      const searchForUrls = (obj: any) => {
        if (!obj) return;
        if (typeof obj === "string") {
          if (obj.includes("photos.zillowstatic.com") &&
              (obj.endsWith(".jpg") || obj.endsWith(".webp") || obj.endsWith(".jpeg") || obj.includes("/fp/"))) {
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
    } catch {}
  }

  const staticPhotoRegex = /https:\/\/photos\.zillowstatic\.com\/[a-zA-Z0-9_\-\/]+\.(?:webp|jpg|jpeg|png)/g;
  const matches = html.match(staticPhotoRegex);
  if (matches) imageUrls.push(...matches);

  imageUrls = imageUrls.map(url =>
    convertToHighRes(url.replace(/\\u002F/g, "/").replace(/\\/g, "").replace(/\\n/g, ""))
  );

  return { urls: deduplicateZillowImages(imageUrls), title: pageTitle };
}

async function fetchPropertyPhotosByAddress(address: string): Promise<string[]> {
  const query = encodeURIComponent(`${address} real estate photos`);
  const offsets = [1, 36, 71, 106];
  const allUrls: string[] = [];

  for (const offset of offsets) {
    try {
      const searchUrl = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=${offset}`;
      const res = await fetch(searchUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      if (!res.ok) continue;

      const html = await res.text();
      const murlRegex = /murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g;
      let match;

      while ((match = murlRegex.exec(html)) !== null) {
        let imgUrl = match[1];
        if (imgUrl.includes("logo") || imgUrl.includes("avatar") || imgUrl.includes("icon") || imgUrl.includes("map")) {
          continue;
        }
        if (imgUrl.includes("rdcpix.com")) {
          imgUrl = imgUrl.replace(/-w\d+_h\d+(_q\d+)?/g, "-w2048_h1536_q80").replace(/s\.jpg$/i, "o.jpg");
        }
        if (imgUrl.includes("photos.zillowstatic.com/fp/")) {
          const hashMatch = imgUrl.match(/\/fp\/([a-fA-F0-9]{32})/);
          if (hashMatch) {
            imgUrl = `https://photos.zillowstatic.com/fp/${hashMatch[1]}-uncropped_scaled_within_1536_1152.jpg`;
          }
        }
        allUrls.push(imgUrl);
      }
    } catch (e) {}
  }
  return Array.from(new Set(allUrls));
}

// ── Vercel Handler ────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  const isZillow = isZillowUrl(sanitizedUrl);
  const isRealtor = isRealtorUrl(sanitizedUrl);

  if (!isZillow && !isRealtor) {
    return res.status(400).json({
      success: false,
      error: "Invalid URL. Please enter a valid Zillow or Realtor.com URL."
    });
  }

  try {
    let scrapeResult = isRealtor
      ? await scrapeRealtorImages(sanitizedUrl).catch(() => ({ urls: [], title: "" }))
      : await scrapeZillowImages(sanitizedUrl).catch(() => ({ urls: [], title: "" }));

    let targetAddress = scrapeResult.title
      ? scrapeResult.title
          .replace(" | Zillow", "")
          .replace(" - Zillow", "")
          .replace(" | Realtor.com®", "")
          .replace(" - Realtor.com®", "")
      : getAddressFromUrl(sanitizedUrl);

    if (scrapeResult.urls.length === 0 && targetAddress) {
      const addressPhotos = await fetchPropertyPhotosByAddress(targetAddress);
      if (addressPhotos.length > 0) {
        scrapeResult = { urls: addressPhotos, title: targetAddress };
      }
    }

    if (scrapeResult.urls.length > 0) {
      const prefix = isRealtor ? "realtor_image" : "zillow_image";
      const imagesList = scrapeResult.urls.map((imageUrl, idx) => {
        const paddedIdx = String(idx + 1).padStart(2, "0");
        const dims = parseZillowImageDimensions(imageUrl);
        return {
          url: imageUrl,
          filename: `${prefix}_${paddedIdx}.jpg`,
          width: dims.width,
          height: dims.height
        };
      });

      return res.status(200).json({
        success: true,
        address: targetAddress,
        images: imagesList,
        isDemoMode: false
      });
    }

    return res.status(200).json({
      success: true,
      address: getAddressFromUrl(sanitizedUrl),
      images: [],
      isDemoMode: true,
      message: "No images found for this listing. Access to this property may be restricted by firewall."
    });

  } catch (error: any) {
    return res.status(200).json({
      success: false,
      error: `Extraction failed: ${error.message}`
    });
  }
}
