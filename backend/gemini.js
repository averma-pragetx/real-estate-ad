import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// Gemini Nano Banana wrapper — image generation for real-estate ads.
// Uses the official SDK.
//
// Model: gemini-2.5-flash-image
// Docs: https://ai.google.dev/gemini-api/docs/image-generation

const GEMINI_MODEL = "gemini-2.5-flash-image";

const FORMAT_SPEC = {
  square: { ratio: "1:1 square (Instagram feed, 1080x1080)", dims: "1080x1080", ratioValue: "1:1", sizeValue: "1080" },
  portrait: { ratio: "4:5 portrait (Instagram, 1080x1350)", dims: "1080x1350", ratioValue: "3:4", sizeValue: "1080" }, // Google doesn't have 4:5, using 3:4 or adjusting
  landscape: { ratio: "16:9 landscape (Facebook/web banner, 1200x675)", dims: "1200x675", ratioValue: "16:9", sizeValue: "1k" },
};

export async function generateDynamicPrompt(input, baseDetails) {
  const openaiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.warn("[generateDynamicPrompt] OpenAI API key not found. Using fallback hardcoded prompt.");
    return buildPromptFallback(input, baseDetails);
  }

  console.log(`[generateDynamicPrompt] Found OPENAI_KEY. Calling OpenAI proxy/gpt-4o-mini...`);
  const openai = new OpenAI({ apiKey: openaiKey });
  
  const photoCount = (input.photos || []).length;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-4
      messages: [
        {
          role: "system",
          content: "You are an expert real-estate advertising copywriter and prompt engineer. Your job is to output an optimal and eye-catching prompt for an image generation model that will design a magazine-quality real estate advertisement based on the user's property details."
        },
        {
          role: "user",
          content: `Generate a highly detailed prompt to create an eye-catching, minimal, and aesthetic real-estate advertisement poster. 
          
          The design should be a professional graphic design layout used for real estate flyers or social media posts. It should seamlessly blend the provided property photos with elegant typography, utilizing generous whitespace and a clean, structural grid (like skewed image panels, neat columns, or a large hero background image). 
          
          CRITICAL INSTRUCTIONS TO INCLUDE IN YOUR OUTPUT PROMPT:
          1. LAYOUT & DESIGN: Explicitly command the image model to arrange the ad as a professional flyer/poster. Use terms like "architectural layout", "aesthetic minimal magazine brochure", "editorial design", "clean grid", "prominent text overlays".
          2. PHOTOS: The user provided exactly ${photoCount} reference photo(s). Command the image model to ONLY use these provided photos, integrating them into the layout (e.g., as the main background or inside stylish frames). Strongly forbid hallucinating or inventing extra rooms, exteriors, or stock photos.
          3. BRANDING: Command the model to write the company name in elegant typography. Strictly forbid hallucinating or generating random logos/icons for the company.
          4. HIGHLIGHTS & TEXT: Specify that the text (price, location, size, bed/bath count) should be cleanly presented with sans-serif or elegant serif fonts. Feature highlights MUST have text next to every bullet point or checkmark, strictly forbidding lone icons with no text.
          
          Here are the property details to incorporate exactly as written:
          ${baseDetails.join('\n')}
          
          Format the output as a single, clear, comprehensive prompt string ready for the image generation model. Do not include any meta-commentary.`
        }
      ]
    });
    console.log(`[generateDynamicPrompt] OpenAI prompt generation succeeded.`);
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("[generateDynamicPrompt] Error calling OpenAI for prompt generation:", error);
    return buildPromptFallback(input, baseDetails);
  }
}

function buildPromptFallback(input, baseDetails) {
  const fmt = FORMAT_SPEC[input.format] || FORMAT_SPEC.square;
  const lines = [
    `Design an aesthetic, minimal, and premium real-estate advertisement poster/flyer in a ${fmt.ratio} format.`,
    `Aesthetic: clean architectural layout, modern editorial design, generous whitespace, elegant typography, professional social-media or magazine brochure style.`,
    ``,
    `Compose the ad with a structured layout:`,
    `- Integrate the exact provided property photos (no stock, no hallucinated rooms) in clean grid frames or as a hero background.`,
    `- A bold, refined headline highlighting the key selling feature.`,
    `- Neatly arranged text blocks for price, location, size, bed/bath count.`,
    `- Highlights must have readable text next to any minimal bullet points or checkmarks.`,
    `- Company branding bar or elegant text overlay for the company name. Do not hallucinate random logos.`,
    ``,
    `Property details to feature on the ad (render exactly as spelled):`,
    ...baseDetails,
    ``,
    `Critical rules:`,
    `- All text must be perfectly legible and professionally typeset.`,
    `- Use a sophisticated color palette (e.g., white background with dark accents, or elegant full-bleed photo with white text overlays).`,
    `- The final output must look like a high-end graphic design poster, not just simple text on a plain background.`,
  ].filter(Boolean);
  return lines.join("\n");
}

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
  
  console.log(`[generateAd] Gathering details and requesting dynamic prompt from OpenAI...`);
  const baseDetails = buildBaseDetails(input);
  const aiGeneratedPromptText = await generateDynamicPrompt(input, baseDetails);
  
  console.log(`[generateAd] Prompt obtained. Final prompt length: ${aiGeneratedPromptText.length} chars.`);
  // console.log(`[generateAd] Prompt preview:\n${aiGeneratedPromptText}`);

  // Up to 14 reference images allowed
  const maxImages = Math.min((input.photos || []).length, 14);
  console.log(`[generateAd] Proceeding to call Gemini with ${maxImages} reference images...`);

  const parts = [{ text: aiGeneratedPromptText }];
  for (let i = 0; i < maxImages; i++) {
    const photo = input.photos[i];
    const part = dataUrlToInlinePart(photo);
    if (part) parts.push(part);
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: parts,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: fmt.ratioValue || "1:1",
          imageSize: "2K"
        }
      }
    });

    console.log(`[generateAd] Received response from Gemini. Processing image...`);
    return getFirstImageFromResponse(response);
  } catch (error) {
    console.error(`[generateAd] Error calling Gemini instance:`, error);
    throw error;
  }
}

function getFirstImageFromResponse(response) {
  // Use official SDK response object
  if (response?.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || "image/png";
        return { image: `data:${mimeType};base64,${part.inlineData.data}`, mimeType };
      }
    }
  }
  
  throw new Error("Gemini did not return an image. No inlineData found in response.");
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
  const maxImages = Math.min((input.photos || []).length, 13); // we have previousImage as one, so keep 13 max.
  for (let i = 0; i < maxImages; i++) {
    const photo = input.photos[i];
    const part = dataUrlToInlinePart(photo);
    if (part) parts.push(part);
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: parts, // format according to @google/genai examples.
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: fmt.ratioValue || "1:1",
        imageSize: "2K"
      }
    }
  });

  return getFirstImageFromResponse(response);
}
