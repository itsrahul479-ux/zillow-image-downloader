import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).send("Method not allowed");

  const { url, filename } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).send("URL parameter is required.");
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());

    if (filename && typeof filename === "string") {
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    } else {
      res.setHeader("Content-Disposition", "inline");
    }

    res.setHeader("Content-Type", contentType);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).send(`Failed to proxy image: ${error.message}`);
  }
}
