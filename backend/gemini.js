// Gemini Nano Banana wrapper — image generation for real-estate ads.
// Uses the REST endpoint so we don't need an SDK.
//
// Model: gemini-2.5-flash-image (a.k.a. Nano Banana)
// Docs: https://ai.google.dev/gemini-api/docs/image-generation

const GEMINI_MODEL = "gemini-2.5-flash-image";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const FORMAT_SPEC = {
  square: { ratio: "1:1 square (Instagram feed, 1080x1080)", dims: "1080x1080" },
  portrait: { ratio: "4:5 portrait (Instagram, 1080x1350)", dims: "1080x1350" },
  landscape: { ratio: "16:9 landscape (Facebook/web banner, 1200x675)", dims: "1200x675" },
};

function buildBaseDetails(input) {
  const highlights = (input.highlights || []).filter(Boolean);
  return [
    input.companyName && `- Company / Brand: ${input.companyName}`,
    input.agentName && `- Listing agent: ${input.agentName}`,
    input.agentPhone && `- Contact: ${input.agentPhone}`,
    input.listingType && `- Listing type: ${input.listingType}`,
    input.propertyType && `- Property type: ${input.propertyType}`,
    input.price && `- Price: ${input.price}`,
    input.location && `- Location: ${input.location}`,
    input.size && `- Size: ${input.size}`,
    input.bedrooms != null && input.bedrooms !== "" && `- Bedrooms: ${input.bedrooms}`,
    input.bathrooms != null && input.bathrooms !== "" && `- Bathrooms: ${input.bathrooms}`,
    highlights.length && `- Highlights: ${highlights.join(", ")}`,
    input.description && `- Description / extra notes: ${input.description}`,
    input.style && `- Style preference: ${input.style}`,
  ].filter(Boolean);
}

function buildPrompt(input) {
  const fmt = FORMAT_SPEC[input.format] || FORMAT_SPEC.square;
  const lines = [
    `Design a premium, magazine-quality real-estate advertisement post in a ${fmt.ratio} format.`,
    `Aesthetic: clean, modern, luxurious. White and deep navy blue color palette with subtle azure accents. Elegant typography. Generous whitespace. Soft shadows. Sophisticated, never cheap or cluttered.`,
    ``,
    `Compose the ad with:`,
    `- A hero area featuring the property photo(s) provided (if any) artfully framed; if no photo, render a tasteful architectural illustration matching the property type.`,
    `- A bold, refined headline that highlights the property's key selling point.`,
    `- Clear, readable text blocks for: price, location, size, bed/bath count.`,
    `- Up to 3 short bullet highlights with small icons.`,
    `- Company branding bar at the bottom with the company name and agent contact.`,
    ``,
    `Property details to feature on the ad:`,
    ...buildBaseDetails(input),
    ``,
    `Critical rules:`,
    `- All on-image text must be spelled exactly as given, perfectly legible, professionally typeset.`,
    `- Color palette is strictly white background with navy/blue typography and accents. No pink, purple, or neon.`,
    `- No watermarks, no stock-photo overlays, no AI artifacts.`,
    `- The final output must look like a real ad designed by a top-tier real-estate marketing agency.`,
    `- Output dimensions: ${fmt.dims}.`,
  ].filter(Boolean);
  return lines.join("\n");
}

function dataUrlToInlinePart(dataUrl) {
  // "data:image/jpeg;base64,XXXX" -> { inlineData: { mimeType, data } }
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

export async function generateAd(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in the environment.");

  const fmt = FORMAT_SPEC[input.format] || FORMAT_SPEC.square;
  console.log(`[generateAd] Using format: ${input.format || "default"} (${fmt.dims})`);
  const prompt = buildPrompt(input);

  const parts = [{ text: prompt }];
  for (const photo of input.photos || []) {
    const part = dataUrlToInlinePart(photo);
    if (part) parts.push(part);
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      temperature: 0.85,
    },
  };

  const resp = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${text}`);
  }

  const json = await resp.json();
  const candidates = json.candidates || [];
  for (const c of candidates) {
    const cParts = c?.content?.parts || [];
    for (const p of cParts) {
      if (p.inlineData?.data) {
        const mimeType = p.inlineData.mimeType || "image/png";
        return { image: `data:${mimeType};base64,${p.inlineData.data}`, mimeType };
      }
    }
  }
  throw new Error("Gemini did not return an image. Raw response: " + JSON.stringify(json).slice(0, 500));
}

function buildRegeneratePrompt(input, refinement) {
  const fmt = FORMAT_SPEC[input.format] || FORMAT_SPEC.square;
  const lines = [
    `You are refining a previously generated real-estate advertisement post.`,
    `Keep the same ${fmt.ratio} format and the original property details below — do NOT drop any information, do NOT change spelled text values (price, location, company, etc.).`,
    `Apply the user's refinement instructions on top of the original design.`,
    ``,
    `Original property details (must remain accurate on the ad):`,
    ...buildBaseDetails(input),
    ``,
    `User refinement instructions (apply these now):`,
    refinement.trim(),
    ``,
    `Critical rules:`,
    `- Preserve all original text values exactly as given (price, location, contact, company name, etc.).`,
    `- Maintain the white + navy/blue palette unless the refinement explicitly asks otherwise.`,
    `- Premium, magazine-quality, professionally typeset. No watermarks or AI artifacts.`,
    `- Output dimensions: ${fmt.dims}.`,
  ];
  return lines.join("\n");
}

export async function regenerateAd({ input, refinement, previousImage }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in the environment.");

  const fmt = FORMAT_SPEC[input.format] || FORMAT_SPEC.square;
  console.log(`[regenerateAd] Using format: ${input.format || "default"} (${fmt.dims})`);
  const prompt = buildRegeneratePrompt(input, refinement);
  const parts = [{ text: prompt }];

  // Feed the previous ad first so Gemini iterates on it, then the source photos.
  if (previousImage) {
    const prev = dataUrlToInlinePart(previousImage);
    if (prev) parts.push(prev);
  }
  for (const photo of input.photos || []) {
    const part = dataUrlToInlinePart(photo);
    if (part) parts.push(part);
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["IMAGE"], temperature: 0.9 },
  };

  const resp = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${text}`);
  }

  const json = await resp.json();
  for (const c of json.candidates || []) {
    for (const p of c?.content?.parts || []) {
      if (p.inlineData?.data) {
        const mimeType = p.inlineData.mimeType || "image/png";
        return { image: `data:${mimeType};base64,${p.inlineData.data}`, mimeType };
      }
    }
  }
  throw new Error("Gemini did not return an image. Raw response: " + JSON.stringify(json).slice(0, 500));
}
